import fs from 'fs';
import path from 'path';

interface AnalyticsRecord {
  _id?: string;
  ip: string;
  country?: string;
  city?: string;
  isp?: string;
  device: string;
  browser: string;
  browserVersion?: string;
  os?: string;
  page: string;
  referrer?: string;
  userAgent: string;
  sessionId: string;
  timeOnPage?: number;
  isNewVisitor: boolean;
  timestamp: Date | string;
  [key: string]: any;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'analytics-fallback.json');

class PersistentFallbackStorage {
  private data: AnalyticsRecord[] = [];
  private maxRecords = 10000;
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.data = parsed;
        }
      }
    } catch (err) {
      console.warn('[FallbackStorage] Could not read fallback file:', err);
    }
  }

  private persistToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(this.data), 'utf8');
    } catch (err) {
      // Ignore write error if filesystem is read-only
    }
  }

  insert(record: AnalyticsRecord): { insertedId: string } {
    this.ensureLoaded();
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const recordWithId = { ...record, _id: id };
    this.data.push(recordWithId);

    if (this.data.length > this.maxRecords) {
      this.data = this.data.slice(-this.maxRecords);
    }

    this.persistToDisk();
    return { insertedId: id };
  }

  find(query: { timestamp?: { $gte: Date } }): AnalyticsRecord[] {
    this.ensureLoaded();
    let results = [...this.data];

    if (query.timestamp?.$gte) {
      results = results.filter((r) => new Date(r.timestamp) >= query.timestamp!.$gte);
    }

    return results;
  }

  count(): number {
    this.ensureLoaded();
    return this.data.length;
  }

  clear(): void {
    this.data = [];
    this.loaded = true;
    this.persistToDisk();
  }

  getAll(): AnalyticsRecord[] {
    this.ensureLoaded();
    return [...this.data];
  }
}

export const inMemoryStorage = new PersistentFallbackStorage();
