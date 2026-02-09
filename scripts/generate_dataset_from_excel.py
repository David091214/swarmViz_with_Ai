#!/usr/bin/env python3
"""Convert DataSample.xlsx into src/data/excelDataset.ts."""

from pathlib import Path
import json
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
XLSX_PATH = ROOT / 'src' / 'data' / 'DataSample.xlsx'
OUTPUT_PATH = ROOT / 'src' / 'data' / 'excelDataset.ts'
NS = {'xlsx': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

SWARM_MAPPING = {
    '-1': ('none', 'No Swarm'),
    '0': ('none', 'No Swarm'),
    '1': ('alpha', 'Alpha'),
    '2': ('beta', 'Beta'),
    '3': ('gamma', 'Gamma'),
    '4': ('delta', 'Delta'),
    '5': ('epsilon', 'Epsilon'),
}

def normalize_state(label: str) -> str:
    return label.strip().lower().replace(' ', '-').replace('_', '-')

def parse_rows():
    with zipfile.ZipFile(XLSX_PATH) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = ''.join(t.text or '' for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'))
                shared_strings.append(text)
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        headers = None
        for row in sheet.findall('xlsx:sheetData/xlsx:row', NS):
            values = []
            for cell in row.findall('xlsx:c', NS):
                cell_type = cell.get('t')
                v = cell.find('xlsx:v', NS)
                if v is None:
                    value = ''
                else:
                    text = v.text or ''
                    if cell_type == 's':
                        value = shared_strings[int(text)]
                    else:
                        value = text
                values.append(value)
            if headers is None:
                headers = values
                continue
            if not values or all((v or '').strip() == '' for v in values):
                continue
            row_dict = {headers[i]: (values[i] if i < len(values) else '') for i in range(len(headers))}
            drone_id = (row_dict.get('DroneID') or '').strip()
            time_point = (row_dict.get('TimePoint') or '').strip()
            if not drone_id or not time_point or not drone_id.replace('-', '').isdigit():
                continue
            yield row_dict

def build_dataset():
    rows = list(parse_rows())
    timepoints = sorted({row['TimePoint'] for row in rows}, key=lambda tp: int(tp[2:]) if tp.upper().startswith('TP') and tp[2:].isdigit() else tp)
    timepoint_index = {label: idx for idx, label in enumerate(timepoints)}
    raw_records = []
    for row in rows:
        swarm_code = row.get('SwarmID', '').strip() or '-1'
        swarm_id, swarm_label = SWARM_MAPPING.get(swarm_code, ('none', 'No Swarm'))

        state_label = (row.get('State') or '').strip() or 'Unknown'
        normalized_state = normalize_state(state_label)

        task_code = row.get('TaskID', '').strip() or '-1'
        if task_code == '-1':
            task_id = 'none'
            task_label = 'No Task'
        else:
            task_id = normalized_state
            task_label = state_label

        raw_records.append({
            'droneId': f"drone-{row['DroneID'].strip()}",
            'timePoint': timepoint_index[row['TimePoint']],
            'timeLabel': row['TimePoint'],
            'swarmId': swarm_id,
            'swarmLabel': swarm_label,
            'taskId': task_id,
            'taskLabel': task_label,
            'state': normalized_state,
            'stateLabel': state_label,
            'position': {
                'x': float(row.get('PositionX') or 0),
                'y': float(row.get('PositionY') or 0),
                'z': float(row.get('PositionZ') or 0),
            },
            'velocity': {
                'x': float(row.get('VelocityX') or 0),
                'y': float(row.get('VelocityY') or 0),
                'z': float(row.get('VelocityZ') or 0),
            },
            'orientation': {
                'pitch': float(row.get('Pitch') or 0),
                'roll': float(row.get('Roll') or 0),
                'yaw': float(row.get('Yaw') or 0),
            },
            'batteryPercentage': float(row.get('Battery Percentage') or 0),
            'detectionRange': float(row.get('Detection Range(Circle)') or 0),
        })

    if not raw_records:
        return {
            'timePoints': [timepoint_index[label] for label in timepoints],
            'timePointLabels': timepoints,
            'drones': [],
            'metadata': {
                'totalDrones': 0,
                'totalTimePoints': len(timepoints),
                'swarmCounts': {},
                'taskCounts': {},
                'stateCounts': {},
                'boundingBox': {
                    'min': {'x': 0, 'y': 0, 'z': 0},
                    'max': {'x': 100, 'y': 0, 'z': 100},
                },
                'swarmLabels': {code: label for code, (_, label) in SWARM_MAPPING.items()},
            },
        }

    min_x = min(rec['position']['x'] for rec in raw_records)
    max_x = max(rec['position']['x'] for rec in raw_records)
    min_z = min(rec['position']['z'] for rec in raw_records)
    max_z = max(rec['position']['z'] for rec in raw_records)

    span_x = max(max_x - min_x, 1e-6)
    span_z = max(max_z - min_z, 1e-6)

    scale_x = 100.0 / span_x
    scale_z = 100.0 / span_z
    detection_scale = (scale_x + scale_z) / 2.0

    for record in raw_records:
        record['position']['x'] = (record['position']['x'] - min_x) * scale_x
        record['position']['z'] = (record['position']['z'] - min_z) * scale_z
        record['detectionRange'] = record['detectionRange'] * detection_scale

    records = sorted(raw_records, key=lambda rec: (int(rec['droneId'].split('-')[-1]), rec['timePoint']))

    swarm_counts = defaultdict(int)
    task_counts = defaultdict(int)
    state_counts = defaultdict(int)
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for rec in records:
        swarm_counts[rec['swarmId']] += 1
        task_counts[rec['taskId']] += 1
        state_counts[rec['state']] += 1
        x = rec['position']['x']
        y = rec['position']['y']
        z = rec['position']['z']
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        min_z = min(min_z, z)
        max_x = max(max_x, x)
        max_y = max(max_y, y)
        max_z = max(max_z, z)
    dataset = {
        'timePoints': [timepoint_index[label] for label in timepoints],
        'timePointLabels': timepoints,
        'drones': records,
        'metadata': {
            'totalDrones': len({rec['droneId'] for rec in records}),
            'totalTimePoints': len(timepoints),
            'swarmCounts': dict(swarm_counts),
            'taskCounts': dict(task_counts),
            'stateCounts': dict(state_counts),
            'boundingBox': {
                'min': {'x': min_x, 'y': min_y, 'z': min_z},
                'max': {'x': max_x, 'y': max_y, 'z': max_z},
            },
            'swarmLabels': {code: label for code, (_, label) in SWARM_MAPPING.items() if code in SWARM_MAPPING},
        },
    }
    return dataset

def write_dataset():
    dataset = build_dataset()
    json_payload = json.dumps(dataset, indent=2)
    content = """// Drone swarm dataset curated for the Swarmscape visualization dashboard.
// Run `python3 scripts/generate_dataset_from_excel.py` to refresh.

import { DroneSwarmDataset } from '@/types/drone';

const rawDataset = `REPLACE_ME`;

export const excelDataset = JSON.parse(rawDataset) as DroneSwarmDataset;
""".replace('REPLACE_ME', json_payload.replace('`', r'\`'))
    OUTPUT_PATH.write_text(content)
    print(f'Updated {OUTPUT_PATH.relative_to(ROOT)} with {len(dataset["drones"])} records.')

if __name__ == '__main__':
    write_dataset()
