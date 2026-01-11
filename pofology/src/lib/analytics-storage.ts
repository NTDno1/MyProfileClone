// Temporary in-memory storage for analytics when MongoDB is unavailable
interface AnalyticsRecord {
  _id?: string;
  ip: string;
  country?: string;
  city?: string;
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
  timestamp: Date;
}

class InMemoryStorage {
  private data: AnalyticsRecord[] = [];
  private maxRecords = 10000; // Limit to prevent memory issues

  insert(record: AnalyticsRecord): { insertedId: string } {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recordWithId = { ...record, _id: id };
    this.data.push(recordWithId);
    
    // Keep only recent records
    if (this.data.length > this.maxRecords) {
      this.data = this.data.slice(-this.maxRecords);
    }
    
    console.log('[InMemoryStorage] 💾 Stored record:', id, 'Total records:', this.data.length);
    return { insertedId: id };
  }

  find(query: { timestamp?: { $gte: Date } }): AnalyticsRecord[] {
    let results = [...this.data];
    
    if (query.timestamp?.$gte) {
      results = results.filter(r => new Date(r.timestamp) >= query.timestamp!.$gte);
    }
    
    return results;
  }

  count(): number {
    return this.data.length;
  }

  clear(): void {
    this.data = [];
    console.log('[InMemoryStorage] 🗑️ Cleared all records');
  }

  getAll(): AnalyticsRecord[] {
    return [...this.data];
  }
}

export const inMemoryStorage = new InMemoryStorage();

