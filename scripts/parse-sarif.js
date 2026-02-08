#!/usr/bin/env node
/* eslint-env node */
/* global process */

/**
 * Parse SARIF files and extract security metrics for notifications
 * Usage: node scripts/parse-sarif.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SARIF_FILES = [
  'results/javascript.sarif',
  'trivy-results.sarif'
];

function parseSarif(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return { file: filePath, issues: 0, errors: [] };
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const results = data.runs?.[0]?.results || [];

    // Count by severity
    const bySeverity = { error: 0, warning: 0, note: 0, none: 0 };
    const byCategory = {};

    results.forEach(result => {
      const level = result.level || 'warning';
      bySeverity[level] = (bySeverity[level] || 0) + 1;

      // Extract category from ruleId
      const ruleId = result.ruleId || 'unknown';
      const category = ruleId.split('/')[0] || 'other';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      file: filePath,
      totalIssues: results.length,
      bySeverity,
      byCategory,
      topIssues: results.slice(0, 5).map(r => ({
        rule: r.ruleId,
        message: r.message?.text,
        level: r.level,
      })),
    };
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return { file: filePath, issues: 0, errors: [error.message] };
  }
}

function generateReport() {
  console.log('\n📊 Security Scan Report\n' + '='.repeat(50));

  const allResults = {};
  SARIF_FILES.forEach(file => {
    const result = parseSarif(file);
    allResults[file] = result;
    
    console.log(`\n📄 ${path.basename(file)}`);
    console.log(`   Total Issues: ${result.totalIssues}`);
    
    if (result.bySeverity) {
      console.log(`   By Severity:`);
      Object.entries(result.bySeverity)
        .filter(([, count]) => count > 0)
        .forEach(([severity, count]) => {
          const icon = severity === 'error' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
          console.log(`     ${icon} ${severity}: ${count}`);
        });
    }

    if (result.byCategory && Object.keys(result.byCategory).length > 0) {
      console.log(`   Top Categories:`);
      Object.entries(result.byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .forEach(([cat, count]) => {
          console.log(`     • ${cat}: ${count}`);
        });
    }
  });

  // Write summary to GitHub output for workflow use
  const totalIssues = Object.values(allResults).reduce((sum, r) => sum + r.totalIssues, 0);
  const criticalCount = Object.values(allResults)
    .reduce((sum, r) => sum + (r.bySeverity?.error || 0), 0);

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Total Issues Found: ${totalIssues}`);
  console.log(`🔴 Critical Issues: ${criticalCount}`);
  console.log(`⚠️  Action: ${criticalCount > 0 ? 'BLOCK_MERGE' : 'ALLOW_MERGE'}`);

  // Export for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `total_issues=${totalIssues}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical_issues=${criticalCount}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_block=${criticalCount > 0 ? 'true' : 'false'}\n`);
  }

  return { totalIssues, criticalCount };
}

// Run report
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { parseSarif, generateReport };
