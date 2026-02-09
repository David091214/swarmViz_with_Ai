import fs from 'fs';

const outputPath = 'docs/swarmscape-homework-explanation.pdf';
fs.mkdirSync('docs', { recursive: true });

const lines = [
  'Drone Swarm Visualization — Code Walkthrough',
  '',
  '1. Data Pipeline',
  '   - excelDataset.ts stores the curated drone telemetry.',
  '   - mockData.ts exposes helpers (generateMockData, getDronesAtTime, getDroneTrajectory).',
  '   - scripts/generate_dataset_from_excel.py refreshes the dataset from spreadsheets.',
  '',
  '2. App Initialization (main.tsx, App.tsx)',
  '   - React mounts in index.html#root and wires up routing plus global UI providers.',
  '',
  '3. Dashboard Composition (DroneSwarmDashboard.tsx)',
  '   - Loads the dataset once, syncs timeline state, and derives filtered drone slices.',
  '   - Splits the viewport into control panel, 3D scene, 2D range map, and analytics tabs.',
  '',
  '4. Control Panel (control-panel.tsx)',
  '   - Toggle swarms, tasks, battery range, trajectories, velocity vectors, and detection rings.',
  '',
  '5. Temporal Logic',
  '   - Timeline component animates playback and exposes scrub/speed controls.',
  '   - Interpolation blends consecutive time points for smooth motion.',
  '',
  '6. 3D Scene (DroneVisualization3D.tsx)',
  '   - Renders drones, detection halos, velocity arrows, and optional trajectories.',
  '   - Shares time-point colours with the 2D map so both views stay in sync.',
  '',
  '7. 2D Range Map (DroneRangeMap2D.tsx)',
  '   - Projects drones onto a top-down grid, draws detection discs and glow markers.',
  '   - Legends translate swarm IDs (SW-1 …) and time-point labels for quick lookup.',
  '',
  '8. Analytics (DroneStatistics.tsx)',
  '   - Summaries cover battery buckets, task allocation, swarm distribution, and alerts.',
  '',
  '9. Styling & Assets',
  '   - index.html defines metadata, favicon, and social previews.',
  '   - Tailwind utility classes orchestrate layout density across components.',
  '',
  'Use this PDF to explain how data flows from the curated dataset through the React components',
  'to deliver coordinated 3D/2D visuals, timeline-driven playback, and operational analytics.'
];

function escapePdfText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  const header = '%PDF-1.4\n';
  const objects = [];
  const offsets = [0];
  let currentOffset = header.length;

  function addObject(content) {
    offsets.push(currentOffset);
    objects.push(content);
    currentOffset += content.length;
  }

  addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  addObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  const pageObj = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  addObject(pageObj);

  const baseY = 720;
  const lineHeight = 16;
  let contentLines = ['BT', '/F1 12 Tf', `72 ${baseY} Td`];
  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    } else {
      contentLines.push(`T* (${escapePdfText(line)}) Tj`);
    }
  });
  contentLines.push('ET');
  const contentStream = contentLines.join('\n');
  const stream = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  addObject(stream);

  addObject('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const xrefOffset = currentOffset;
  let xref = 'xref\n0 ' + (offsets.length) + '\n';
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return header + objects.join('') + xref;
}

const pdfContent = buildPdf(lines);
fs.writeFileSync(outputPath, pdfContent, 'binary');
console.log(`Created ${outputPath}`);
