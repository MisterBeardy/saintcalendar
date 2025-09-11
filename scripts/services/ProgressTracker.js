/**
 * Progress Tracker Service
 * Tracks import operations and provides progress reporting
 */
class ProgressTracker {
  constructor(total = 0, description = '') {
    this.total = total;
    this.current = 0;
    this.description = description;
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
  }

  update(current, message = '') {
    this.current = current;
    const percentage = this.total > 0 ? Math.round((current / this.total) * 100) : 0;
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`[${this.description}] ${percentage}% (${current}/${this.total}) - ${message} (${elapsed}s elapsed)`);
  }

  increment(message = '') {
    this.current++;
    this.update(this.current, message);
  }

  addError(error) {
    this.errors.push(error);
    console.error(`❌ Error: ${error}`);
  }

  addWarning(warning) {
    this.warnings.push(warning);
    console.warn(`⚠️  Warning: ${warning}`);
  }

  getSummary() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    return {
      total: this.total,
      processed: this.current,
      duration,
      errors: this.errors.length,
      warnings: this.warnings.length,
      successRate: this.total > 0 ? Math.round((this.current / this.total) * 100) : 0
    };
  }
}

export default ProgressTracker;