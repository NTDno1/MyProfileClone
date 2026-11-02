# Danh sách Kiến thức Phỏng vấn - Senior .NET Backend Developer / Technical Lead

Tuyệt vời! Dựa trên CV chi tiết của bạn với hơn 4 năm kinh nghiệm làm Full-Stack (đặc biệt mạnh về Backend .NET), tôi đã tùy chỉnh lại toàn bộ bộ câu hỏi và kiến thức chuẩn bị phỏng vấn. Hồ sơ của bạn cho thấy sự trưởng thành từ việc code tính năng, tối ưu hóa DB, xây dựng kiến trúc (CQRS, Clean Architecture), đến dẫn dắt team và làm các hệ thống chịu tải cao (High Availability, Load Balancing).

Dưới đây là những câu hỏi và kiến thức trọng tâm bạn cần ôn tập kỹ, kết hợp sát với những dự án bạn đã ghi trong CV (AgileTech, HopLongTech, MobiFoneIT).

---

## Phụ Lục — Mục Lục Chi Tiết

### Phần 1: Nền tảng .NET & C#

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 1.1 | `IEnumerable` vs `IQueryable` | [Dòng 147](#sec-ienumerable) |
| 1.2 | GC & `IDisposable` | [Dòng 342](#sec-gc) |
| 1.3 | `Task`, `ValueTask`, `Thread` & Deadlock | [Dòng 547](#sec-async) |
| 1.4 | Vòng đời DI | [Dòng 741](#sec-di) |
| 1.5 | Clean Architecture, CQRS & DDD | [Dòng 881](#sec-cqrs-ddd) |

### Phần 2: Lớp Dữ liệu & Tối ưu hóa

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 2.1 | EF Core vs Dapper & N+1 Queries | [Dòng 1176](#sec-ef-dapper) |
| 2.2 | Deadlock, Index & Read/Write Replication | [Dòng 1345](#sec-deadlock) |

### Phần 3: Kiến trúc Hệ thống & Messaging

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 3.1 | RabbitMQ, Redis & SignalR | [Dòng 1525](#sec-rabbitmq) |
| 3.2 | Quartz.NET vs `IHostedService` | [Dòng 1702](#sec-quartz) |
| 3.3 | Load Balancing & File Storage | [Dòng 1794](#sec-lb-storage) |

### Phần 4: Xử lý Đồng bộ Dữ liệu

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 4.1 | Transactional Outbox Pattern | [Dòng 1915](#sec-outbox) |

### Phần 5: Kiến thức Công nghệ mở rộng

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 5.1 | API Gateway, Rate Limit & Audit | [Dòng 2077](#sec-apigw) |
| 5.2 | gRPC vs REST vs RabbitMQ | [Dòng 2190](#sec-grpc) |
| 5.3 | PostgreSQL Multi DB, Report DB & MINIO | [Dòng 2297](#sec-multidb) |
| 5.4 | Docker Swarm, ELK & Monitoring | [Dòng 2387](#sec-docker) |
| 5.5 | AI, LLM, Vector DB & RAG | [Dòng 2480](#sec-ai) |
| 5.6 | Security, RBAC/ABAC & Backup | [Dòng 2563](#sec-security) |

### Phần 6: Kiến thức Nghiệp vụ Hệ thống

| # | Câu hỏi / Chủ đề | Trang |
|---|---|---|
| 6.1 | Document Management & Dynamic Workflow | [Dòng 2641](#sec-workflow) |
| 6.2 | Concurrency Control | [Dòng 2741](#sec-concurrency) |
| 6.3 | Integration, LDAP & Notifications | [Dòng 2824](#sec-integration) |

---

### Bảng tra cứu nhanh theo từ khóa

| Từ khóa | Phần liên quan |
|---|---|
| [`IQueryable`, `IEnumerable`, `Expression Tree`](#sec-ienumerable) | 1.1 — Dòng 147 |
| [`GC`, `Dispose`, `IDisposable`, `Finalizer`](#sec-gc) | 1.2 — Dòng 342 |
| [`async/await`, `deadlock`, `Task`](#sec-async) | 1.3 — Dòng 547 |
| [`Singleton`, `Scoped`, `Transient`, `DI`](#sec-di) | 1.4 — Dòng 741 |
| [`CQRS`, `MediatR`, `Aggregate`, `Value Object`](#sec-cqrs-ddd) | 1.5 — Dòng 881 |
| [`N+1`, `Include`, `SplitQuery`, `AsNoTracking`](#sec-ef-dapper) | 2.1 — Dòng 1176 |
| [`Deadlock`, `UPDLOCK`, `RowVersion`, `NOLOCK`](#sec-deadlock) | 2.2 — Dòng 1345 |
| [`Replication`, `Read Replica`](#sec-deadlock) | 2.2 — Dòng 1345 |
| [`RabbitMQ`, `Exchange`, `DLQ`, `Fanout`, `Topic`](#sec-rabbitmq) | 3.1 — Dòng 1525 |
| [`SignalR`, `Hub`, `Realtime`, `Backplane`](#sec-rabbitmq) | 3.1 — Dòng 1525 |
| [`Redis`, `Token blacklist`, `Rate limit`](#sec-rabbitmq) | 3.1 — Dòng 1525 |
| [`Quartz`, `Cron`, `IHostedService`, `Cluster`](#sec-quartz) | 3.2 — Dòng 1702 |
| [`JWT`, `Load Balancing`, `Presigned URL`](#sec-lb-storage) | 3.3 — Dòng 1794 |
| [`Outbox`, `Idempotency`, `Dual-Write`](#sec-outbox) | 4 — Dòng 1915 |
| [`API Gateway`, `NGINX`, `Rate Limit`](#sec-apigw) | 5.1 — Dòng 2077 |
| [`Token Bucket`, `Leaky Bucket`](#sec-apigw) | 5.1 — Dòng 2077 |
| [`Audit Log`, `Correlation ID`](#sec-apigw) | 5.1 — Dòng 2077 |
| [`gRPC`, `Protobuf`, `HTTP/2`](#sec-grpc) | 5.2 — Dòng 2190 |
| [`Saga Pattern`, `Distributed Transaction`](#sec-multidb) | 5.3 — Dòng 2297 |
| [`Report DB`, `Denormalized`](#sec-multidb) | 5.3 — Dòng 2297 |
| [`MINIO`, `S3`, `Multipart Upload`](#sec-multidb) | 5.3 — Dòng 2297 |
| [`Docker`, `Swarm`, `Container`](#sec-docker) | 5.4 — Dòng 2387 |
| [`ELK`, `Elasticsearch`, `Kibana`](#sec-docker) | 5.4 — Dòng 2387 |
| [`Health Check`, `Prometheus`, `Kubernetes`](#sec-docker) | 5.4 — Dòng 2387 |
| [`LLM`, `RAG`, `Vector DB`, `Embedding`](#sec-ai) | 5.5 — Dòng 2480 |
| [`OAuth2`, `OIDC`, `MFA`, `SSO`](#sec-security) | 5.6 — Dòng 2563 |
| [`RBAC`, `ABAC`, `Phân quyền`](#sec-security) | 5.6 — Dòng 2563 |
| [`HSM`, `Ký số`, `PDF Signature`](#sec-security) | 5.6 — Dòng 2563 |
| [`Workflow`, `WorkflowEngine`, `Dynamic`](#sec-workflow) | 6.1 — Dòng 2641 |
| [`Concurrency`, `Optimistic`, `Pessimistic`](#sec-concurrency) | 6.2 — Dòng 2741 |
| [`VBDQ`, `XML`, `LDAP`, `AD`](#sec-integration) | 6.3 — Dòng 2824 |
| [`Notification`, `Email`, `SMS`, `Push`](#sec-integration) | 6.3 — Dòng 2824 |

---

### Chú thích mức độ quan trọng khi ôn tập

```
⭐⭐⭐ NGUYỆT SAO — BẮT BUỘC phải nắm vững (Senior level)
├── CQRS, MediatR, DDD (1.5)
├── Deadlock xử lý + N+1 Queries (2.1, 2.2)
├── Transactional Outbox Pattern (4)
├── RabbitMQ Exchange, DLQ, Retry (3.1)
├── JWT, Redis, DI Lifetime bugs (1.4, 3.1, 3.3)
├── gRPC vs RabbitMQ decision + gRPC code (5.2)
├── Health Check + Correlation ID + ELK (5.4)
└── Concurrency Control: Optimistic vs Pessimistic (6.2)

⭐⭐ THƯỜNG — Hiểu rõ, trả lời được
├── IEnumerable vs IQueryable (1.1)
├── GC Generations + IDisposable Pattern (1.2)
├── Task vs ValueTask + Deadlock prevention (1.3)
├── EF Core vs Dapper decision matrix (2.1)
├── Quartz vs IHostedService (3.2)
├── API Gateway + Rate Limit algorithms (5.1)
├── Clean Architecture DIP (1.5)
├── RBAC/ABAC Hybrid + OAuth2 (5.6)
└── Dynamic Workflow Engine (6.1)

⭐ CƠ BẢN — Nắm khái niệm
├── Docker vs VM (5.4)
├── Read/Write Replication (2.2)
├── S3 Presigned URL + PDF Signature (3.3)
├── LLM + RAG + Vector DB (5.5)
├── VBDQ + LDAP Integration (6.3)
└── Notification Queue Architecture (6.3)
```

---

---

## 1. Nền tảng .NET & C# (Core Expertise & Architecture)

**1.1. C#, .NET 9 & ASP.NET Core**
- Điểm khác biệt giữa `IEnumerable` và `IQueryable`? Khi nào nên dùng cái nào?
- Quản lý bộ nhớ (Garbage Collection - GC) trong .NET hoạt động như thế nào? Phân biệt Managed và Unmanaged resources, cách dùng `IDisposable` (hàm `Dispose()`).
- Phân biệt `Task`, `ValueTask` và `Thread`. Làm sao để tránh hiện tượng *Deadlock* khi dùng Async/Await?
- Vòng đời của Dependency Injection (DI) trong .NET Core: `AddTransient`, `AddScoped`, `AddSingleton`.

<a id="sec-ienumerable"></a>
### Câu trả lời chi tiết: `IEnumerable` vs `IQueryable`

#### 1. Định nghĩa và Vị trí trong .NET Type Hierarchy

```
IQueryable<T> (System.Linq)
       ▲
       │ (inherits)
       │
IEnumerable<T> (System.Collections.Generic)
       ▲
       │ (inherits)
       │
IEnumerable (System.Collections)
```

**Điểm mấu chốt:** `IQueryable<T>` kế thừa `IEnumerable<T>`. Mọi `IQueryable<T>` đều là `IEnumerable<T>`, nhưng `IEnumerable<T>` thì chưa chắc là `IQueryable<T>`.

#### 2. Điểm khác biệt Cốt lõi

| Khía cạnh | `IEnumerable<T>` | `IQueryable<T>` |
|---|---|---|
| **Nơi thực thi** | Trên **máy khách** (in-memory) | Trên **máy chủ DB** (server-side) |
| **Cơ chế** | LINQ to Objects | LINQ to Entities |
| **Toán tử** | Extension methods trong `Enumerable` | Extension methods trong `Queryable` |

#### 3. Minh hoạ bằng Code

```csharp
// ─── IEnumerable: Toàn bộ dữ liệu được nạp vào RAM trước ───
IEnumerable<Product> products = dbContext.Products;
var result = products
    .Where(p => p.Price > 100)     // Lọc trong C# (in-memory)
    .OrderBy(p => p.Name)           // Sắp xếp trong C# (in-memory)
    .ToList();                      // SQL: SELECT * FROM Products (toàn bộ!)

// ─── IQueryable: Expression Tree được xây dựng, thực thi ở SQL Server ───
IQueryable<Product> query = dbContext.Products; // Chưa chạy query!
var result = query
    .Where(p => p.Price > 100)      // Tạo Expression Tree
    .OrderBy(p => p.Name)           // Tạo Expression Tree
    .ToList();                      // Chỉ khi gọi ToList() → 1 câu SQL tối ưu
```

#### 4. Cơ chế bên trong — Expression Tree vs Delegate

**`IEnumerable` — Sử dụng Delegate (Func\<...\>):**
```csharp
// Lambda p => p.Price > 100 được biên dịch thành IL code (compile-time)
// → Khi chạy, nó chạy C# code lọc từng object trong bộ nhớ
public static IEnumerable<TSource> Where<TSource>(
    this IEnumerable<TSource> source,
    Func<TSource, bool> predicate)  // ← Delegate
```

**`IQueryable` — Sử dụng Expression Tree (Expression\<Func\<...\>\>):**
```csharp
// Lambda p => p.Price > 100 được parse thành Expression Tree (cấu trúc dữ liệu)
// → LINQ Provider (EF Core) đọc cấu trúc này và dịch thành SQL tối ưu
public static IQueryable<TSource> Where<TSource>(
    this IQueryable<TSource> source,
    Expression<Func<TSource, bool>> predicate)  // ← Expression Tree
```

#### 5. SQL Generated — Proof

```sql
-- IEnumerable (thảm họa với 1 triệu bản ghi):
SELECT * FROM Products;           -- Lấy toàn bộ → tải ~2-3 GB vào RAM
-- C# lọc: WHERE Price > 100 trong bộ nhớ

-- IQueryable (tối ưu):
SELECT [p].[Id], [p].[Name], [p].[Price]
FROM [Products] AS [p]
WHERE [p].[Price] > 100
ORDER BY [p].[Name];              -- Chỉ trả về kết quả đã lọc, đã sort
```

#### 6. Decision Matrix

```
┌──────────────────────────────────────────────────────────┐
│  Từ DB ra ngoài → Giữ IQueryable, đừng ToList() sớm    │
│  Đã có data rồi → Dùng IEnumerable, filter/sort RAM     │
│  Thao tác DB → Luôn ưu tiên IQueryable + EF Core       │
└──────────────────────────────────────────────────────────┘
```

**Dùng `IQueryable<T>` khi:**
- Truy vấn trực tiếp từ Database qua EF Core
- Xây dựng Dynamic Query (build query động theo nhiều điều kiện)
- Phân trang phía Server (CountAsync + Skip/Take)
- Kết hợp `AsNoTracking()` để tối ưu read-only queries

**Dùng `IEnumerable<T>` khi:**
- Đã `ToList()` rồi, cần xử lý tiếp trong bộ nhớ
- Làm việc với In-Memory Collection thuần túy
- Dùng logic C# phức tạp mà SQL không translate được (gọi external service, xử lý regex...)
- **Ví dụ cụ thể — NHỮNG TRƯỜNG HỢP SQL KHÔNG XỬ LÝ ĐƯỢC:**

```csharp
// ─── 1. Gọi HTTP/External Service ───────────────────────────
var result = products.Where(async p =>
{
    var price = await _pricingService.GetPriceAsync(p.ExternalId);
    return price > 100;
}).ToList();
// ❌ SQL không thể translate async lambda, không gọi được HTTP

// ─── 2. Regex Pattern Matching ──────────────────────────────
var matches = products.Where(p =>
    Regex.IsMatch(p.Name, @"^\d{3}-[A-Z]{2}-\d{4}$")).ToList();
// ❌ SQL Server có LIKE/PATINDEX nhưng regex phức tạp thì KHÔNG

// ─── 3. Logic kinh doanh phức tạp ────────────────────────
var eligible = orders.Where(o =>
{
    var daysSinceOrder = (DateTime.UtcNow - o.CreatedAt).Days;
    var discount = o.Customer.IsVip ? 0.15m : 0.05m;
    var shippingCost = daysSinceOrder > 30 ? 0 : o.ShippingFee;
    return o.Total * (1 - discount) - shippingCost > 500;
}).ToList();
// ❌ Nhiều biến, logic kinh doanh phức tạp — SQL translate được nhưng
//    bảng Order không có IsVip (là navigation property), EF phải JOIN

// ─── 4. Gọi static method / utility không có trong SQL ───
var valid = users.Where(u => SHA256.HashData(u.Password).ToString() == u.StoredHash).ToList();
// ❌ SQL không có SHA256.HashData() — dù EF Core 7+ hỗ trợ một số
//    string method như String.Concat, String.IsNullOrEmpty

// ─── 5. Xử lý JSON/Dictionary trong bộ nhớ ──────────────
var filtered = responses.Where(r =>
    JsonSerializer.Deserialize<Metadata>(r.JsonData)?.Tags.Contains("urgent") ?? false).ToList();
// ❌ JSON_VALUE() có trong SQL Server nhưng nested query JSON phức tạp
//    nên load lên RAM xử lý bằng C# cho dễ

// ─── 6. Thuật toán AI/ML scoring ─────────────────────────
var ranked = candidates.Where(c =>
    _scoringModel.Predict(c.ResumeEmbedding) > 0.75).ToList();
// ❌ ML model không chạy được trong SQL — bắt buộc phải
//    load candidate data lên, gọi model, rồi filter

// ─── 7. Lấy dữ liệu từ Redis/Cache trong predicate ─────
var cached = products.Where(p => _cache.Get<int>($"price:{p.Id}") > 500).ToList();
// ❌ Lambda của Where không hỗ trợ await/gọi service bên ngoài DB
//    → Phải load all → filter in-memory

// ─── KHI NÀO DÙNG IEnumerable thay vì IQueryable? ─────────
// ✅ Dùng IEnumerable khi:
//    - Đã ToList() rồi, cần filter thêm trong RAM
//    - Cần gọi external service trong filter
//    - Logic regex/dynamic language feature phức tạp
//    - Dataset đã nhỏ sau khi WHERE phía DB rồi
//    - Dùng thuật toán không translate được (ML, Hashing, ...)

// ✅ Tối ưu: Kết hợp BOTH — query DB bằng IQueryable,
//    rồi filter thêm bằng IEnumerable trong RAM
var dbResults = await _context.Products
    .Where(p => p.CategoryId == categoryId)     // IQueryable: lọc ở SQL
    .Where(p => p.IsActive)                    // IQueryable: lọc ở SQL
    .ToListAsync();                            // Chuyển → In-Memory

var finalResults = dbResults                    // IEnumerable: lọc ở RAM
    .Where(p => Regex.IsMatch(p.Name, pattern))
    .Where(p => ComputeScore(p) > threshold)
    .ToList();
```

| Loại logic | IQueryable (SQL) | IEnumerable (RAM) | Ghi chú |
|---|---|---|---|
| `Where(p => p.Price > 100)` | ✅ translate | ✅ | Đơn giản |
| `Regex.IsMatch(p.Name, @"\d+")` | ❌ không translate | ✅ | Regex phức tạp |
| Gọi HTTP/external API | ❌ không translate | ✅ | Bắt buộc in-memory |
| ML model `.Predict()` | ❌ không translate | ✅ | Model chạy ngoài DB |
| `JsonSerializer.Deserialize()` | ⚠️ giới hạn | ✅ | JSON phức tạp nên in-memory |
| SHA256 / Hashing | ⚠️ giới hạn | ✅ | Tùy EF version |
| Navigation property `.Customer.IsVip` | ✅ translate (JOIN) | ✅ | EF tự generate JOIN |
| `(DateTime.UtcNow - p.Created).Days` | ⚠️ translate được nhưng `DateTime.UtcNow` là fixed value | ✅ chính xác hơn | Khi cần realtime |

**Anti-pattern cần tránh:**
```csharp
// ❌ SAI: ToList() quá sớm, mất lazy evaluation
var query = _context.Products.Where(p => p.Name.Contains(keyword)).ToList();
return query.Where(p => p.IsActive).ToList(); // Double processing!

// ✅ ĐÚNG: Chain tiếp vào IQueryable
return await _context.Products
    .Where(p => p.Name.Contains(keyword))
    .Where(p => p.IsActive)
    .ToListAsync(); // 1 query SQL tối ưu duy nhất
```

**Tip thực tế cho phỏng vấn:** Kể scenario thực tế — dự án ERP ở HopLongTech, báo cáo chạy rất chậm với dataset lớn vì dùng `IEnumerable`, chuyển sang `IQueryable` để SQL Server xử lý filter/sort → giảm từ 30 giây xuống còn 200ms (mô hình STAR).

<a id="sec-gc"></a>
### Câu trả lời chi tiết: Garbage Collection & IDisposable

#### 1. Memory Management trong .NET — Hai vùng bộ nhớ

.NET chia bộ nhớ managed (do GC quản lý tự động) và unmanaged (do developer quản lý thủ công):

```
┌─────────────────────────────────────────────────────────┐
│                    HEAP Managed                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Gen 0    │  │ Gen 1    │  │ Gen 2    │  ┌─────────┐│
│  │ (0-256KB│  │ (lớn hơn)│  │ (lớn nhất│  │ LOH     ││
│  │ ~85% GC)│  │          │  │  Objects)│  │ (>85KB) ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 UNMANAGED (Native heap)                  │
│  Database connections, File handles, Socket, GDI+       │
│  → Developer PHẢI giải phóng thủ công bằng Dispose()  │
└─────────────────────────────────────────────────────────┘
```

#### 2. Garbage Collection — Generation và cơ chế

```csharp
// GC hoạt động theo 3 thế hệ (Generations):
// Gen 0: Object mới tạo (ngắn hạn) → GC chạy thường xuyên nhất (~85% trường hợp)
// Gen 1: Object sống sót sau Gen 0 GC (trung hạn)
// Gen 2: Object sống lâu dài (long-lived) → GC chạy ít nhất

public class MemoryDemo
{
    public void Process()
    {
        var obj = new byte[1024]; // Tạo trên Gen 0
        GC.AddMemoryPressure(1024);
        // Xử lý...
        // Khi method kết thúc, obj out of scope → đánh dấu sẵn sàng GC
        GC.RemoveMemoryPressure(1024);
    }
}
```

**Các loại GC trong .NET:**

| Loại GC | Mô tả | Khi nào dùng |
|---|---|---|
| `GC.Collect(0)` | Chỉ collect Gen 0 | Hiếm khi cần, test memory |
| `GC.Collect(2)` | Full GC toàn bộ heap | Chỉ dùng khi cần release lớn sau loading lớn |
| `GC.WaitForPendingFinalizers()` | Đợi Finalizer chạy xong | Sau GC.Collect khi có Finalizer |
| `GCSettings.LatencyMode` | Batch/Interactive/Low | Điều chỉnh độ ưu tiên GC |

**GC Modes:**
- **Workstation GC** (mặc định desktop): GC chạy trên thread app, tối ưu responsiveness
- **Server GC** (mặc định server): Nhiều GC thread riêng, tối ưu throughput

```csharp
// Cấu hình Server GC trong .csproj
<PropertyGroup>
  <ServerGarbageCollection>true</ServerGarbageCollection>
</PropertyGroup>

// Hoặc runtime config
"runtimeOptions": {
  "configProperties": {
    "System.GC.Server": true
  }
}
```

#### 3. Managed vs Unmanaged Resources

**Managed Resources** (GC tự động): Object trên Heap C# — string, list, class instance. KHÔNG cần Dispose.

**Unmanaged Resources** (thủ công): Tài nguyên native bên ngoài .NET:
- `SqlConnection`, `HttpClient`, `StreamReader`, `FileStream`
- Database connections, Network sockets, GDI handles
- COM objects, Native memory (Marshal.AllocHGlobal)

```csharp
// ❌ SAI: Không dispose → connection pool bị exhaust
public void BadExample()
{
    var conn = new SqlConnection(connectionString);
    conn.Open();
    // Làm gì đó...
    // KHÔNG gọi conn.Dispose()
    // Nếu exception xảy ra ở giữa → conn không bao giờ được giải phóng!
}

// ✅ ĐÚNG: Dùng using statement
public void GoodExample()
{
    using var conn = new SqlConnection(connectionString);
    conn.Open();
    // Làm gì đó...
}
// Tự động gọi Dispose() khi thoát khối using, kể cả khi có exception
```

#### 4. IDisposable Pattern — Triển khai đúng chuẩn

```csharp
public class DatabaseService : IDisposable
{
    private SqlConnection _connection;
    private StreamReader _logFile;     // Unmanaged
    private bool _disposed = false;    // Flag để phân biệt dispose rồi vs chưa

    public DatabaseService()
    {
        _connection = new SqlConnection("...");
        _logFile = new StreamReader("log.txt");
    }

    // Triển khai IDisposable đúng chuẩn với cả Dispose() và Finalizer
    public void Dispose()
    {
        Dispose(true);  // Dispose(true): giải phóng cả managed + unmanaged
        GC.SuppressFinalize(this); // Ngăn Finalizer chạy lại
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // Managed resources: gọi Dispose() / Close()
                _connection?.Dispose();    // SqlConnection tự đóng connection
                _logFile?.Dispose();        // StreamReader giải phóng file handle
            }
            // Unmanaged resources: giải phóng trực tiếp nếu có P/Invoke
            // NativeMemory.Free(ptr); // Marshal.FreeHGlobal(ptr);

            _disposed = true;
        }
    }

    // Finalizer: chạy nếu Developer QUÊN gọi Dispose()
    // Chỉ dùng cho Unmanaged resources vì Managed đã không còn đáng tin cậy
    ~DatabaseService()
    {
        Dispose(false); // Không dispose managed resources ở Finalizer
                       // (chúng có thể đã bị GC thu gom trước rồi)
    }
}
```

**Sử dụng:**
```csharp
// Pattern 1: using statement (KHUYẾN NGHỊ)
using var service = new DatabaseService();
service.Query();

// Pattern 2: try-finally (tương đương)
var service = new DatabaseService();
try {
    service.Query();
}
finally {
    service.Dispose();
}

// Pattern 3: DI container tự quản lý lifetime
// .NET Core DI sẽ tự gọi Dispose() khi scope kết thúc
services.AddScoped<DatabaseService>();
```

#### 5. Kết hợp GC + IDisposable trong thực tế

```csharp
// Ví dụ: Service dùng HttpClient (UNMANAGED resource)
// HttpClient không được dispose theo cách thông thường → dùng IHttpClientFactory
public class ProductService : IDisposable
{
    private readonly IHttpClientFactory _httpClientFactory;
    private HttpClient _client; // KHÔNG nên dispose HttpClient trực tiếp

    public ProductService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
        // _client = new HttpClient() ← SAI! Tạo socket exhaustion
    }

    public async Task<Product> GetProductAsync(int id)
    {
        using var client = _httpClientFactory.CreateClient();
        return await client.GetFromJsonAsync<Product>($"/api/products/{id}");
    }

    public void Dispose()
    {
        _client?.Dispose();
    }
}

// Đăng ký trong DI
services.AddHttpClient("Products", c => c.BaseAddress = new Uri("https://api.example.com"));
services.AddScoped<ProductService>();
```

**Tip phỏng vấn:** Nhấn mạnh rằng `Dispose()` không giải phóng bộ nhớ ngay lập tức — nó chỉ đánh dấu object không còn reference, rồi GC sẽ thu gom ở lần chạy tiếp theo. Finalizer tồn tại như "safety net" cuối cùng cho Unmanaged resources khi developer quên Dispose.

<a id="sec-async"></a>
### Câu trả lời chi tiết: Task, ValueTask, Thread & Deadlock

#### 1. Thread vs Task vs ValueTask — Phân biệt nền tảng

```
┌─────────────────────────────────────────────────────────────────┐
│ Thread (System.Threading.Thread)                                │
│ • Đơn vị thực thi nhỏ nhất trên OS, nặng (~1MB stack)         │
│ • OS Scheduler quản lý, chuyển context tốn kém                │
│ • Không tái sử dụng, tạo mới mỗi lần → chi phí cao            │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Task (System.Threading.Tasks.Task)                              │
│ • Abstraction mức cao trên Thread, nhẹ hơn (~1KB)              │
│ • CLR ThreadPool quản lý → tái sử dụng thread                  │
│ • Promise/Future pattern: đại diện cho 1 operation đang chạy   │
│ • Hỗ trợ ContinueWith, WhenAll, WhenAny, CancellationToken     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ ValueTask (System.Threading.Tasks.ValueTask)                     │
│ • Cấu trúc (struct) thay vì class → không allocate heap        │
│ • Dùng cho async operations THƯỜNG XUYÊN HOÀN THÀNH NGAY      │
│ • Tránh allocation khi sync path chiếm đa số                   │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Minh hoạ bằng Code — Thread

```csharp
// Thread: Tạo thread mới, nặng, không pooled
public void ThreadExample()
{
    var thread = new Thread(() =>
    {
        Console.WriteLine("Running in thread");
    });
    thread.Start();
    thread.Join();
    // Nếu tạo 1000 threads → ~1GB RAM!
}
```

#### 3. Task — Mô hình bất đồng bộ chuẩn

```csharp
public async Task<string> GetDataAsync()
{
    using var client = new HttpClient();
    var result = await client.GetStringAsync("https://api.example.com/data");
    return result;
}

public async Task ProcessAllAsync()
{
    var task1 = GetUserAsync(1);
    var task2 = GetOrderAsync(1);
    var task3 = GetProductAsync(1);
    await Task.WhenAll(task1, task2, task3); // Đợi tất cả hoàn thành
}

// ContinueWith — chuỗi operation
public Task ChainAsync()
{
    return GetDataAsync()
        .ContinueWith(t => ParseData(t.Result))
        .ContinueWith(t => SaveToDb(t.Result));
}

// CancellationToken — hủy operation
public async Task CancelableAsync(CancellationToken ct)
{
    await Task.Delay(5000, ct); // Hủy được khi cần
}
```

#### 4. ValueTask — Tối ưu bộ nhớ

```csharp
// Task: MỖI lần gọi đều allocate object trên HEAP
public async Task<int> CalculateAsync(int n)
{
    await Task.Delay(1);
    return n * 2;
}

// ValueTask: Chỉ allocate khi thực sự async
public async ValueTask<int> CalculateValueAsync(int n)
{
    if (n < 0)
        return -n; // Sync return → KHÔNG allocate heap!
    await Task.Delay(1);
    return n * 2;
}

// Điều kiện dùng ValueTask: async operation thường hoàn thành ngay
public async ValueTask<int> FindAsync(IQueryable<Product> products, int id)
{
    var cached = _cache.Get(id);
    if (cached != null)
        return cached; // ✅ Fast path: zero allocation
    var product = await products.FirstOrDefaultAsync(p => p.Id == id);
    return product?.Price ?? 0;
}

// ⚠️ LƯU Ý: ValueTask chỉ await TỐI ĐA 1 lần
```

#### 5. Deadlock — Nguyên nhân và cách phòng tránh

**Nguyên nhân cốt lõi:** Synchronous code đợi asynchronous code trong context đã bị chiếm.

```csharp
// ─── DEADLOCK kinh điển với .Result ───
public class DeadlockExample1
{
    private readonly HttpClient _client = new HttpClient();

    // ❌ DEADLOCK: Khi gọi từ ASP.NET MVC / WinForms / WPF
    // (ASP.NET Core: SynchronizationContext = null → KHÔNG deadlock!)
    public string GetDataSync()
    {
        return _client.GetStringAsync("https://api.example.com").Result;
        // 1. .Result BLOCKS thread hiện tại
        // 2. async method chiếm SynchronizationContext
        // 3. Khi await, nó post continuation vào SynchronizationContext
        // 4. Nhưng thread đang bị .Result BLOCK
        // 5. DEADLOCK!
    }

    // ✅ GIẢI PHÁP 1: .GetAwaiter().GetResult()
    public string GetDataFixed1()
    {
        return _client.GetStringAsync("https://api.example.com")
            .GetAwaiter().GetResult();
    }

    // ✅ GIẢI PHÁP 2: Make method async hoàn toàn
    public async Task<string> GetDataAsync()
    {
        return await _client.GetStringAsync("https://api.example.com");
    }

    // ✅ GIẢI PHÁP 3: .ConfigureAwait(false)
    public async Task<string> GetDataNoContext()
    {
        return await _client.GetStringAsync("https://api.example.com")
            .ConfigureAwait(false);
    }
}

// ─── Async void (nguy hiểm nhất) ───
public class DeadlockExample2
{
    // ❌ NGUY HIỂM: async void không có cách bắt exception
    private async void ProcessData() => await SomeAsyncOperation();

    // ✅ ĐÚNG: async Task
    private async Task ProcessDataFixed() => await SomeAsyncOperation();
}

// ─── Library code: LUÔN dùng ConfigureAwait(false) ───
public class LibraryCode
{
    public virtual async Task<string> LibraryMethodAsync()
    {
        await Task.Delay(100).ConfigureAwait(false);
        await DoWorkAsync().ConfigureAwait(false);
        return "done";
        // Library code không cần resume trên calling context
    }
}
```

**Quy tắc phòng tránh Deadlock:**

```csharp
// ✅ QUY TẮC VÀNG:
// 1. KHÔNG BAO GIỜ dùng .Result hoặc .Wait() trên Task
// 2. LUÔN dùng async/await đến cùng
// 3. Library code LUÔN dùng .ConfigureAwait(false)
// 4. Chỉ dùng .GetAwaiter().GetResult() khi BẮT BUỘC phải sync
//    (vd: field initializer, constructor)
```

#### 6. So sánh Thread, Task, ValueTask

| Tiêu chí | Thread | Task | ValueTask |
|---|---|---|---|
| **Trọng lượng** | Nặng (~1MB) | Nhẹ (ThreadPool) | Nhẹ nhất (struct, 0 alloc) |
| **Tái sử dụng** | Không | Có (ThreadPool) | Có (ThreadPool) |
| **Return value** | Thủ công | Tự nhiên | Tự nhiên |
| **Khi nào dùng** | CPU-bound nặng | I/O-bound, async/await | I/O-bound với sync path phổ biến |

<a id="sec-di"></a>
### Câu trả lời chi tiết: Vòng đời Dependency Injection (DI)

#### 1. Ba Lifetime trong .NET Core DI

```
┌──────────────────────────────────────────────────────────────────┐
│  AddSingleton  │ AddScoped        │ AddTransient                  │
├────────────────┼─────────────────┼───────────────────────────────┤
│  1 instance    │ 1 instance per   │ NEW instance EVERY time       │
│  per app       │ HTTP request     │ of injection                 │
├────────────────┼─────────────────┼───────────────────────────────┤
│  • Config      │ • DbContext      │ • ViewModels (per screen)     │
│  • Logger      │ • HttpContext    │ • Input DTOs                 │
│  • Cache       │ • Repositories   │ • Operations/Commands        │
│  • Settings    │ • UnitOfWork     │ • Request-scoped services    │
└────────────────┴─────────────────┴───────────────────────────────┘
```

#### 2. Minh hoạ bằng Code — Singleton

```csharp
public class SingletonService : ISingletonService
{
    private readonly Guid _instanceId = Guid.NewGuid();
    public Guid InstanceId => _instanceId;
}

services.AddSingleton<ISingletonService, SingletonService>();

public void SingletonDemo(IServiceProvider sp)
{
    var s1 = sp.GetRequiredService<ISingletonService>();
    var s2 = sp.GetRequiredService<ISingletonService>();
    Console.WriteLine(s1.InstanceId == s2.InstanceId); // TRUE!
    // Cùng 1 object → dùng chung state → CẨN THẬN thread-safety!
}
```

#### 3. Minh hoạ bằng Code — Scoped (Phổ biến nhất)

```csharp
public class ScopedService : IScopedService
{
    private readonly Guid _instanceId = Guid.NewGuid();
    public Guid InstanceId => _instanceId;
}

services.AddScoped<IScopedService, ScopedService>();

// ─── 1 instance per HTTP request ───
public class OrderController : ControllerBase
{
    private readonly IScopedService _scoped1;
    private readonly IScopedService _scoped2;
    // scoped1 và scoped2 → cùng instance TRONG request này
}

// ─── Tạo nested scope (BackgroundService) ───
public class BackgroundJob : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _serviceProvider.CreateScope(); // Scope MỚI
            var scoped = scope.ServiceProvider.GetRequiredService<IScopedService>();
            // Mỗi lần lặp → instanceId MỚI vì scope MỚI
        }
    }
}
```

#### 4. Minh hoạ bằng Code — Transient

```csharp
public class TransientService : ITransientService
{
    private readonly Guid _instanceId = Guid.NewGuid();
    public Guid InstanceId => _instanceId;
}

services.AddTransient<ITransientService, TransientService>();

// ─── Mỗi lần inject là instance MỚI ───
public class CartService
{
    public CartService(ITransientService t1, ITransientService t2)
    {
        // _t1.InstanceId != _t2.InstanceId → TRUE!
    }
}
```

#### 5. Kết hợp nhiều lifetime trong thực tế

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Singleton: Cache, Config, Logger, HttpClientFactory
    services.AddSingleton<ICacheService, RedisCacheService>();
    services.AddSingleton<IAppSettings, AppSettings>();

    // Scoped: DbContext, Repository, UnitOfWork, CurrentUser
    services.AddDbContext<AppDbContext>(...);
    services.AddScoped<IProductRepository, ProductRepository>();
    services.AddScoped<IUnitOfWork, UnitOfWork>();

    // Transient: DTOs, Commands, Queries
    services.AddTransient<CreateProductCommand>();
    services.AddTransient<GetProductQuery>();

    // ⚠️ SAI: Inject Scoped service vào Singleton
    // Scoped service bị "captured" bởi Singleton → sống suốt app lifetime!
    // → Bug phổ biến → memory leak và stale data!

    // ✅ Singleton dùng IServiceScopeFactory để tạo scope khi cần
    public class SingletonWithScope : ISingletonService
    {
        public void DoWork()
        {
            using var scope = _scopeFactory.CreateScope();
            var scoped = scope.ServiceProvider.GetRequiredService<IScopedRepo>();
            scoped.GetData();
        }
    }
}
```

#### 6. Bảng quyết định Lifetime

| Service Type | Lifetime | Lý do |
|---|---|---|
| `DbContext` | **Scoped** | Mỗi request cần 1 DbContext riêng |
| `ILogger` | **Singleton** | ILogger stateless, dùng chung |
| `IHttpClientFactory` | **Singleton** | Quản lý HttpMessageHandler pool |
| `IRepository` | **Scoped** | Liên kết với DbContext scope |
| `ICurrentUser` | **Scoped** | Mỗi request có user identity riêng |
| `Command/Query (MediatR)` | **Transient** | Mỗi request tạo mới, stateless |

<a id="sec-cqrs-ddd"></a>
### Câu trả lời chi tiết: Clean Architecture, CQRS & DDD

#### 1. Clean Architecture — Cấu trúc project

```
Solution
├── Domain (Không phụ thuộc gì cả)
│   ├── Entities/ (Order, Customer, Product)
│   ├── ValueObjects (Money, Address, Email)
│   ├── Aggregates (OrderAggregate)
│   ├── Events (DomainEvents)
│   └── Interfaces (IRepository, IUnitOfWork)
│
├── Application (Phụ thuộc Domain, không phụ thuộc Infrastructure)
│   ├── Commands/CreateOrderCommand.cs
│   ├── Queries/GetOrderQuery.cs
│   ├── Interfaces (IEmailService, IFileStorageService)
│   ├── DTOs/
│   └── Services/
│
├── Infrastructure (Phụ thuộc Domain + Application)
│   ├── Persistence/ (EF Core DbContext, Repositories)
│   ├── Email/ (SmtpEmailService)
│   ├── FileStorage/ (S3StorageService)
│   └── Messaging/ (RabbitMqService)
│
└── Presentation / WebAPI (Phụ thuộc Application)
    ├── Controllers/
    ├── Middleware/
    └── Filters/
```

**Dependency Inversion Principle (DIP):**

```csharp
// Domain không biết gì về Infrastructure (EF Core, RabbitMQ, SMTP)
// Chỉ định nghĩa interface

// Domain/Interfaces/IRepository.cs
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(int id);
    Task AddAsync(Order order);
}

// Application/Commands/CreateOrderHandler.cs
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, int>
{
    private readonly IOrderRepository _orderRepo; // Phụ thuộc interface (abstraction)
    private readonly IEmailService _emailService; // Abstraction, không phải implementation

    public async Task<int> Handle(CreateOrderCommand request)
    {
        var order = new Order(request.CustomerId);
        foreach (var item in request.Items)
            order.AddItem(item.ProductId, item.Quantity);

        await _orderRepo.AddAsync(order); // Gọi qua interface
        await _emailService.SendOrderConfirmationAsync(order); // Gọi qua interface

        return order.Id;
    }
}

// Infrastructure/Persistence/EfOrderRepository.cs
public class EfOrderRepository : IOrderRepository // Implement interface
{
    private readonly AppDbContext _context;
    public async Task<Order> GetByIdAsync(int id)
    {
        return await _context.Orders.FindAsync(id);
    }
}

// Infrastructure/Email/SmtpEmailService.cs
public class SmtpEmailService : IEmailService { }

// WebAPI/Startup.cs — Wiring DI
services.AddScoped<IOrderRepository, EfOrderRepository>();
services.AddScoped<IEmailService, SmtpEmailService>();

// → Application KHÔNG biết EF hay Dapper
// → Application KHÔNG biết SMTP hay SendGrid
// → Infrastructure implement interface của Domain/Application
```

#### 2. CQRS kết hợp MediatR

```csharp
// ─── CQRS: Tách Command (Write) và Query (Read) ───

// Command: Ghi — Trả về void hoặc ID, không trả về DTO phức tạp
public record CreateOrderCommand(int CustomerId, List<OrderItemDto> Items)
    : IRequest<int>; // Trả về int = OrderId

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, int>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IUnitOfWork _uow;

    public async Task<int> Handle(CreateOrderCommand request)
    {
        var order = new Order(request.CustomerId);
        foreach (var item in request.Items)
            order.AddItem(item.ProductId, item.Quantity);

        _orderRepo.Add(order);
        await _uow.SaveChangesAsync(); // EF Core tracking → tự sinh INSERT/UPDATE

        return order.Id;
    }
}

// Query: Đọc — Trả về DTO, KHÔNG có business logic, KHÔNG có EF tracking
public record GetOrderDetailQuery(int OrderId) : IRequest<OrderDetailDto?>;

public class GetOrderDetailHandler : IRequestHandler<GetOrderDetailQuery, OrderDetailDto?>
{
    private readonly IDbConnection _db; // Dapper connection

    public async Task<OrderDetailDto?> Handle(GetOrderDetailQuery request)
    {
        // SQL tay, read-only, không tracking overhead
        var sql = @"
            SELECT o.Id, o.CustomerId, c.Name AS CustomerName,
                   SUM(oi.Quantity * oi.UnitPrice) AS TotalAmount
            FROM Orders o
            INNER JOIN Customers c ON o.CustomerId = c.Id
            INNER JOIN OrderItems oi ON o.Id = oi.OrderId
            WHERE o.Id = @OrderId
            GROUP BY o.Id, o.CustomerId, c.Name";

        return await _db.QueryFirstOrDefaultAsync<OrderDetailDto>(sql, new { request.OrderId });
    }
}

// ─── MediatR — Decouple Controller khỏi Handler ───
[ApiController]
public class OrderController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrderController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command)
    {
        // Controller không biết handler nào xử lý → clean, testable
        var orderId = await _mediator.Send(command);
        return Created($"/api/orders/{orderId}", new { id = orderId });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var result = await _mediator.Send(new GetOrderDetailQuery(id));
        if (result == null) return NotFound();
        return Ok(result);
    }
}

// Đăng ký MediatR
services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(CreateOrderCommand).Assembly));
```

**Tại sao chọn CQRS cho dự án ERP:**
- Báo cáo phức tạp (nhiều bảng, aggregate) cần query riêng, không ảnh hưởng write operations
- Write side dùng EF Core để tận dụng change tracking, domain events
- Read side dùng Dapper để tối ưu tốc độ đọc
- Scale độc lập: read replicas cho báo cáo, write master cho giao dịch

#### 3. DDD — Aggregate Roots, Value Objects, Domain Events

```csharp
// ─── Aggregate Root: Giữ invariant, là điểm vào duy nhất ───
public class OrderAggregate : BaseEntity
{
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public int CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }

    // Constructor private — chỉ tạo qua Factory Method
    private OrderAggregate() { } // EF Core cần

    public static OrderAggregate Create(int customerId)
    {
        if (customerId <= 0)
            throw new DomainException("Invalid customer");

        return new OrderAggregate
        {
            CustomerId = customerId,
            Status = OrderStatus.Draft,
            TotalAmount = Money.Zero
        };
    }

    public void AddItem(int productId, int quantity)
    {
        if (Status != OrderStatus.Draft)
            throw new DomainException("Không thể thêm item vào order đã xác nhận");

        var item = new OrderItem(Id, productId, quantity);
        _items.Add(item);
        RecalculateTotal();

        // Raise Domain Event — KHÔNG gọi infrastructure ở đây
        AddDomainEvent(new OrderItemAddedEvent(Id, productId, quantity));
    }

    // ─── Domain Event ───
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    public void AddDomainEvent(IDomainEvent evt) => _domainEvents.Add(evt);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

// ─── Value Object: Immutable, không có identity, so sánh bằng giá trị ───
public record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    private Money(decimal amount, string currency)
    {
        if (amount < 0) throw new DomainException("Amount không âm");
        Amount = amount;
        Currency = currency;
    }

    public static Money Zero => new(0, "VND");
    public static Money FromDecimal(decimal amount, string currency = "VND") => new(amount, currency);

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException("Currency không khớp");
        return new Money(Amount + other.Amount, Currency);
    }

    // Value Objects so sánh bằng giá trị, không bằng reference
    public override bool Equals(object? obj) =>
        obj is Money other && Amount == other.Amount && Currency == other.Currency;
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);
}

// ─── Domain Entity (không phải Aggregate Root) — không public constructor ───
public class OrderItem : BaseEntity
{
    public int OrderId { get; private set; }
    public int ProductId { get; private set; }
    public int Quantity { get; private set; }
    public Money UnitPrice { get; private set; }

    private OrderItem() { } // EF Core

    public OrderItem(int orderId, int productId, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity phải > 0");

        OrderId = orderId;
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = Money.Zero; // Sẽ được set bởi OrderAggregate
    }
}

// ─── Domain Event Handler — xử lý event trong Application Layer ───
public class OrderItemAddedEventHandler : INotificationHandler<OrderItemAddedEvent>
{
    private readonly IEmailService _emailService;

    public async Task Handle(OrderItemAddedEvent notification,
        CancellationToken cancellationToken)
    {
        // Gửi email sau khi thêm item
        await _emailService.SendNotificationAsync(notification);
    }
}
```

**Thiết kế Domain Entity không phụ thuộc EF Core:**
- Entity KHÔNG có `virtual` trên navigation properties
- KHÔNG có `[Key]`, `[Column]` attributes
- KHÔNG có DbContext trong Domain project
- Dùng Fluent API trong Infrastructure project để map

<a id="sec-ef-dapper"></a>
### Câu trả lời chi tiết: Entity Framework Core vs Dapper & N+1 Queries

#### 1. So sánh hiệu năng EF Core vs Dapper

| Tiêu chí | Entity Framework Core | Dapper |
|---|---|---|
| **Philosophy** | ORM đầy đủ | Micro ORM (lightweight) |
| **Viết code** | Tự động generate SQL | Viết SQL tay |
| **Tracking** | Change tracking tự động | Không tracking (read-only) |
| **Query speed** | Chậm hơn (~2-5x) | Nhanh hơn |
| **Dev speed** | Nhanh hơn | Chậm hơn |
| **Relationship** | Navigation properties | Phải join thủ công |

#### 2. Khi nào dùng EF Core, khi nào dùng Dapper?

```csharp
// ─── Dùng EF Core cho COMMAND (Write) ───
public class OrderCommandService
{
    private readonly AppDbContext _context;

    public async Task<int> CreateOrderAsync(CreateOrderDto dto)
    {
        var order = new Order
        {
            CustomerId = dto.CustomerId,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending
        };

        _context.Orders.Add(order); // EF Core tracking → tự sinh INSERT
        await _context.SaveChangesAsync(); // 1 transaction
        return order.Id;
    }
}

// ─── Dùng Dapper cho QUERY (Read-only, Report) ───
public class ReportQueryService
{
    private readonly IDbConnection _connection;

    public async Task<List<SalesReportDto>> GetSalesReportAsync(DateTime from, DateTime to)
    {
        var sql = @"
            SELECT p.CategoryName,
                   COUNT(DISTINCT o.CustomerId) AS CustomerCount,
                   SUM(oi.Quantity) AS TotalQuantity,
                   SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue
            FROM Orders o
            INNER JOIN OrderItems oi ON o.Id = oi.OrderId
            INNER JOIN Products p ON oi.ProductId = p.Id
            WHERE o.OrderDate BETWEEN @From AND @To
              AND o.Status = 'Completed'
            GROUP BY p.CategoryName
            ORDER BY TotalRevenue DESC";

        var result = await _connection.QueryAsync<SalesReportDto>(sql, new { From = from, To = to });
        return result.ToList(); // Zero tracking → tiết kiệm memory
    }

    // Dynamic Query
    public async Task<List<ProductDto>> SearchProductAsync(string name, decimal? minPrice)
    {
        var sql = new StringBuilder("SELECT Id, Name, Price FROM Products WHERE 1=1");
        var dynamicParams = new DynamicParameters();

        if (!string.IsNullOrEmpty(name))
        {
            sql.Append(" AND Name LIKE @Name");
            dynamicParams.Add("Name", $"%{name}%");
        }
        if (minPrice.HasValue)
        {
            sql.Append(" AND Price >= @MinPrice");
            dynamicParams.Add("MinPrice", minPrice.Value);
        }
        return (await _connection.QueryAsync<ProductDto>(sql.ToString(), dynamicParams)).ToList();
    }
}
```

#### 3. N+1 Queries — Bệnh kinh điển của EF Core

```csharp
// ─── N+1 thảm họa ───
var orders = await _context.Orders.Take(100).ToListAsync(); // Query 1
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name); // N queries thêm!
}
// Tổng: 101 queries! → N+1 = 101
```

**Proof SQL:**
```sql
-- Query 1 (lấy Orders)
SELECT * FROM Orders LIMIT 100;
-- Query 2, 3, ... 101 (mỗi lần truy cập Customer → EF sinh query riêng)
SELECT * FROM Customers WHERE Id = @p0;
SELECT * FROM Customers WHERE Id = @p1;
-- ... lặp lại 100 lần!
```

**Cách khắc phục:**

```csharp
// ─── GIẢI PHÁP 1: Eager Loading với Include ───
var orders = await _context.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Where(o => o.Status == OrderStatus.Completed)
    .Take(100)
    .AsNoTracking()
    .ToListAsync();
// 1 query JOIN

// ─── GIẢI PHÁP 2: Split Query (EF Core 5.0+) ───
var orders = await _context.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
    .AsSplitQuery() // Tách thành 2-3 queries riêng biệt
    .Take(100)
    .ToListAsync();
// Query 1 = Orders, Query 2 = Customers, Query 3 = Items

// ─── GIẢI PHÁP 3: Projections (TỐI ƯU NHẤT) ───
return await _context.Orders
    .Where(o => o.Status == OrderStatus.Completed)
    .Take(100)
    .Select(o => new OrderDto
    {
        Id = o.Id,
        CustomerName = o.Customer.Name,
        TotalAmount = o.Items.Sum(i => i.Quantity * i.UnitPrice)
    })
    .AsNoTracking()
    .ToListAsync();
// SQL: SELECT Id, Customer.Name, SUM(...) — chỉ 1 query, chỉ select cột cần

// ─── GIẢI PHÁP 4: Dapper cho truy vấn phức tạp ───
public async Task<List<OrderReportDto>> GetOrdersDapperAsync()
{
    var sql = @"
        SELECT o.Id, o.OrderDate, c.Name AS CustomerName,
               SUM(oi.Quantity * oi.UnitPrice) AS TotalAmount
        FROM Orders o
        INNER JOIN Customers c ON o.CustomerId = c.Id
        INNER JOIN OrderItems oi ON o.Id = oi.OrderId
        WHERE o.Status = 'Completed'
        GROUP BY o.Id, o.OrderDate, c.Name
        ORDER BY o.OrderDate DESC";
    return (await _connection.QueryAsync<OrderReportDto>(sql)).ToList();
}
```

**Decision Matrix cho N+1:**

```
┌──────────────────────────────────────────────────────────────┐
│ Load 1 entity + navigation props nhẹ  → Include()            │
│ Load 1 entity + nhiều collections lớn → AsSplitQuery()      │
│ Chỉ cần 1 vài cột cụ thể            → Projections .Select() │
│ Truy vấn phức tạp (aggregate/join)  → Dapper hoặc Raw SQL   │
│ Không cần navigation props          → AsNoTracking()         │
└──────────────────────────────────────────────────────────────┘
```

<a id="sec-deadlock"></a>
### Câu trả lời chi tiết: Deadlock, Index & Read/Write Replication

#### 1. Deadlock — Giải thích sâu

```
Deadlock xảy ra khi hai transaction chờ đợi lẫn nhau và không thể tiếp tục.

  Transaction A                          Transaction B
  1. BEGIN TRANSACTION                  1. BEGIN TRANSACTION
  2. UPDATE Orders SET ... WHERE Id=1   2. UPDATE Products SET ... WHERE Id=1
     → Lock X on Orders[1]                → Lock X on Products[1]
  3. UPDATE Products SET ... WHERE Id=1  3. UPDATE Orders SET ... WHERE Id=1
     → BLOCKED! Đợi Products[1]           → BLOCKED! Đợi Orders[1]
  4. ...chờ mãi...                      4. ...chờ mãi...
  ════════════════════════════════════════════════════════════
  SQL Server phát hiện deadlock sau ~5 giây → kill 1 trong 2
```

**Loại Deadlock thường gặp:**

| Loại | Mô tả |
|---|---|
| **Classic (2-way)** | A đợi B, B đợi A |
| **Multi-statement** | Nhiều bước trong 1 transaction |
| **Bookmark Lookup** | Index seek + lookup lock rows |
| **Escalation** | Row lock → Page lock → Table lock |

#### 2. Cách giải quyết Deadlock

```csharp
// ─── GIẢI PHÁP 1: Thứ tự truy xuất bảng NHẤT QUÁN ───
// QUY TẮC VÀNG: Mọi transaction phải truy xuất bảng theo cùng 1 thứ tự
// ❌ SAI: Transaction A update Orders→Products, Transaction B update Products→Orders
// ✅ ĐÚNG: Luôn UPDATE Orders TRƯỚC Products
public async Task GoodTransactionAsync()
{
    using var tran = await _context.Database.BeginTransactionAsync();
    await _context.Database.ExecuteSqlRawAsync(
        "UPDATE Orders SET Status='Processing' WHERE Id=@p0", orderId);
    await _context.Database.ExecuteSqlRawAsync(
        "UPDATE Products SET Stock=Stock-1 WHERE Id=@p0", productId);
    await tran.CommitAsync();
}

// ─── GIẢI PHÁP 2: Thu nhỏ kích thước Transaction ───
public async Task SmallTransactionAsync()
{
    foreach (var p in products)
    {
        using var tran = _context.Database.BeginTransaction();
        try
        {
            var product = await _context.Products.FindAsync(p.Id);
            product.Price = CalculatePrice(p);
            await _context.SaveChangesAsync();
            await tran.CommitAsync();
        }
        catch { await tran.RollbackAsync(); }
    }
}

// ─── GIẢI PHÁP 3: Retry Pattern cho Transient Deadlock ───
public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation)
{
    for (int attempt = 1; attempt <= MaxRetries; attempt++)
    {
        using var tran = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await operation();
            await tran.CommitAsync();
            return result;
        }
        catch (DbUpdateException ex) when (IsDeadlockException(ex))
        {
            await tran.RollbackAsync();
            if (attempt == MaxRetries) throw;
            var delay = BaseDelayMs * (int)Math.Pow(2, attempt - 1);
            await Task.Delay(delay);
        }
        catch
        {
            await tran.RollbackAsync(); throw;
        }
    }
    throw new InvalidOperationException();
}

private bool IsDeadlockException(DbUpdateException ex) =>
    ex.InnerException?.Message.Contains("deadlock") == true ||
    ex.InnerException?.Message.Contains("1205") == true;

// ─── GIẢI PHÁP 4: NOLOCK cho báo cáo ───
var sql = @"
    SELECT COUNT(*) AS TotalOrders, SUM(TotalAmount) AS TotalRevenue
    FROM Orders o WITH (NOLOCK)
    INNER JOIN OrderItems oi WITH (NOLOCK) ON o.Id = oi.OrderId
    WHERE o.OrderDate >= @FromDate";
// ⚠️ NOLOCK: Đọc dirty/uncommitted data — chỉ dùng cho report
```

#### 3. Index — Clustered vs Non-Clustered

```sql
-- CLUSTERED INDEX
-- Sắp xếp VẬT LÝ dữ liệu trên disk theo thứ tự key
-- MỖI BẢNG CHỈ CÓ TỐI ĐA 1 clustered index
CREATE CLUSTERED INDEX IX_Orders_OrderDate ON Orders (OrderDate);

-- NON-CLUSTERED INDEX
-- Bảng riêng, chứa KEY + Bookmark (pointer đến row)
-- MỖI BẢNG CÓ THỂ CÓ NHIỀU non-clustered indexes (tối đa 999)
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId ON Orders (CustomerId);

-- KHI NÀO INDEX KHÔNG CÓ TÁC DỤNG:
-- 1. Hàm trên cột indexed
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2024;
-- ❌ Index trên OrderDate không dùng được
-- ✅ WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'

-- 2. LIKE với wildcard đầu
SELECT * FROM Products WHERE Name LIKE '%phone%';
-- ❌ Không dùng được index
-- ✅ Dùng FULL-TEXT SEARCH hoặc LIKE 'phone%' (prefix only)

-- 3. Data type không khớp (implicit conversion)
SELECT * FROM Orders WHERE CustomerId = '123'; -- CustomerId là INT
-- ❌ Implicit convert → full table scan!
-- ✅ Dùng: CustomerId = 123

-- 4. Column không chọn lọc (low selectivity)
SELECT * FROM Users WHERE Gender = 'Male';
-- ❌ 50% users là Male → index không hiệu quả
-- ✅ Index chỉ hiệu quả khi selectivity > 95%

-- Kiểm tra bằng Execution Plan:
SET STATISTICS IO ON;
-- Logical Reads: cao = table scan, thấp = index seek
```

#### 4. Read/Write Replication

```csharp
// ─── Factory tách Read/Write ───
public class ReplicationDbContextFactory
{
    private readonly string _masterConnectionString;
    private readonly string _replicaConnectionString;

    public AppDbContext CreateReadContext() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_replicaConnectionString).Options);

    public AppDbContext CreateWriteContext() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_masterConnectionString).Options);
}

public class ProductRepository : IProductRepository
{
    public async Task<List<ProductDto>> GetProductsAsync()
    {
        using var ctx = _factory.CreateReadContext(); // → Replica
        return await ctx.Products.AsNoTracking()
            .Select(p => new ProductDto { Id = p.Id, Name = p.Name })
            .ToListAsync();
    }

    public async Task CreateProductAsync(Product product)
    {
        using var ctx = _factory.CreateWriteContext(); // → Master
        ctx.Products.Add(product);
        await ctx.SaveChangesAsync();
    }
}
```

**Tip phỏng vấn:** Kể scenario HopLongTech — báo cáo doanh thu chạy chậm 30s vì cùng 1 DB master vừa phục vụ writes vừa phục vụ reads. Giải pháp: cấu hình read replica, tách read/write → báo cáo giảm xuống 2s, user nhập liệu không bị ảnh hưởng.

<a id="sec-rabbitmq"></a>
### Câu trả lời chi tiết: RabbitMQ, Redis & SignalR

#### 1. RabbitMQ — Exchange Types

```
Producer → Exchange → Routing Key → Queue → Consumer

┌──────────────────────────────────────────────────────────────────┐
│ DIRECT: routing_key phải KHỚP CHÍNH XÁC                         │
│   order.created → [Queue: order-created]                         │
├──────────────────────────────────────────────────────────────────┤
│ TOPIC: Routing key support wildcards (# = nhiều từ, * = 1 từ) │
│   product.electronics.# → [Queue: all-products]                  │
│   product.electronics.* → [Queue: electronics]                  │
├──────────────────────────────────────────────────────────────────┤
│ FANOUT: Bỏ qua routing key, gửi đến TẤT CẢ queues             │
│   → [Queue: email] + [Queue: sms] + [Queue: push]               │
└──────────────────────────────────────────────────────────────────┘
```

```csharp
// Direct Exchange
channel.ExchangeDeclare("order.events", ExchangeType.Direct, durable: true);
channel.QueueDeclare("order-created", durable: true);
channel.QueueBind("order-created", "order.events", "order.created");
channel.BasicPublish("order.events", "order.created", body, props);

// Topic Exchange
channel.QueueDeclare("electronics-products", durable: true);
channel.QueueBind("electronics-products", "product.events", "product.electronics.*");

// Fanout Exchange — notification
channel.ExchangeDeclare("notification.all", ExchangeType.Fanout, durable: true);
channel.QueueDeclare("email-notify", durable: true);
channel.QueueBind("email-notify", "notification.all", "");
channel.QueueDeclare("sms-notify", durable: true);
channel.QueueBind("sms-notify", "notification.all", "");
```

#### 2. Dead Letter Queue (DLQ)

```
Producer → Exchange → Queue (main) ─[reject/nack/timeout]→ DLQ
                                    [max 3 retry]
```

```csharp
// Cấu hình DLQ
var args = new Dictionary<string, object>
{
    { "x-dead-letter-exchange", "dlx.exchange" },
    { "x-dead-letter-routing-key", "dlq.order.created" }
};
channel.QueueDeclare("order-created", durable: true, arguments: args);

// DLX Exchange + DLQ
channel.ExchangeDeclare("dlx.exchange", ExchangeType.Direct, durable: true);
channel.QueueDeclare("dlq.order-created", durable: true);
channel.QueueBind("dlq.order-created", "dlx.exchange", "dlq.order.created");

// Consumer: reject lần cuối → vào DLQ
channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
```

#### 3. RabbitMQ + SignalR — Realtime Notification

```csharp
// ─── Producer: Job chạy xong → SignalR notification ───
public class ExportJob : IJob
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public async Task Execute(IJobExecutionContext context)
    {
        var jobId = context.MergedJobDataMap.GetString("JobId");
        var userId = context.MergedJobDataMap.GetString("UserId");

        try
        {
            var result = await _exportService.ExportReportAsync(jobId);

            // Đẩy realtime notification đến đúng user
            await _hubContext.Clients
                .User(userId)
                .SendAsync("ExportCompleted", new
                {
                    JobId = jobId,
                    FileUrl = result.FileUrl,
                    Message = $"Báo cáo đã sẵn sàng!"
                });
        }
        catch (Exception ex)
        {
            await _hubContext.Clients
                .User(userId)
                .SendAsync("ExportFailed", new { JobId = jobId, Error = ex.Message });
        }
    }
}

// ─── SignalR Hub ───
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }
}

// ─── Client-side (React/Angular) ───
_hubConnection.On<dynamic>("ExportCompleted", data =>
{
    console.log("Báo cáo hoàn thành!", data.FileUrl);
    toastService.ShowSuccess(data.Message);
});

// ─── SignalR với Redis Backplane (nhiều server) ───
services.AddSignalR()
    .AddStackExchangeRedis("redis-connection-string", options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("signalr");
    });
// Khi Job chạy trên Server A, notification vẫn gửi đến user trên Server B
```

#### 4. Redis — Single Device Login & Token Blacklist

```csharp
public class RedisTokenService
{
    private readonly IDatabase _redis;
    private readonly TimeSpan _tokenLifetime = TimeSpan.FromHours(2);

    // Single Device Login: token mới ghi đè token cũ
    public async Task<string> CreateAccessTokenAsync(int userId)
    {
        var token = GenerateJwtToken(userId);
        var userKey = $"user:token:{userId}";

        var oldToken = await _redis.StringGetAsync(userKey);
        if (!oldToken.IsNullOrEmpty)
            await _redis.StringSetAsync($"blacklist:{oldToken}", "1", _tokenLifetime);

        await _redis.StringSetAsync(userKey, token, _tokenLifetime);
        return token;
    }

    // Blacklist Token (Logout)
    public async Task BlacklistTokenAsync(string token)
    {
        await _redis.StringSetAsync($"blacklist:{token}", "1", _tokenLifetime);
    }

    // Kiểm tra token bị blacklist không
    public async Task<bool> IsTokenBlacklistedAsync(string token)
    {
        return await _redis.KeyExistsAsync($"blacklist:{token}");
    }

    // Rate Limiting sliding window
    public async Task<bool> CheckRateLimitAsync(string userId, int maxRequests, TimeSpan window)
    {
        var key = $"ratelimit:{userId}:{DateTime.UtcNow.Ticks / window.Ticks}";
        var current = await _redis.StringIncrementAsync(key);
        if (current == 1)
            await _redis.KeyExpireAsync(key, window);
        return current <= maxRequests;
    }
}
```

<a id="sec-quartz"></a>
### Câu trả lời chi tiết: Quartz.NET vs IHostedService

#### 1. So sánh IHostedService vs Quartz.NET

| Tiêu chí | IHostedService | Quartz.NET |
|---|---|---|
| **Scheduling** | Timer đơn giản | Cron expression phức tạp |
| **Persistence** | In-memory, mất khi restart | Job data lưu trong DB |
| **Retry** | Thủ công | Built-in retry |
| **Cluster** | Không hỗ trợ | Hỗ trợ clustered execution |
| **Misfire** | Không xử lý | Tự phát hiện và xử lý |
| **Cron** | Phải tự tính | `0 0 8 ? * MON-FRI` |

#### 2. IHostedService — Dùng cho tác vụ đơn giản

```csharp
public class HealthCheckService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.CanConnectAsync(stoppingToken);
                _logger.LogInformation("Health check OK");
            }
            catch (Exception ex) { _logger.LogError(ex, "Health check FAILED"); }
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
services.AddHostedService<HealthCheckService>();
```

#### 3. Quartz.NET — Lập lịch phức tạp

```csharp
[DisallowConcurrentExecution]
public class ProcessInvoicesJob : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        var jobData = context.MergedJobDataMap;
        var month = jobData.GetIntValue("Month");
        var year = jobData.GetIntValue("Year");

        using var scope = _scopeFactory.CreateScope();
        var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();
        var result = await invoiceService.ProcessPendingInvoicesAsync(month, year);

        if (result.FailedCount > 0)
            throw new Exception($"{result.FailedCount} invoices failed");
    }
}

// Đăng ký Jobs
IJobDetail invoiceJob = JobBuilder.Create<ProcessInvoicesJob>()
    .WithIdentity("process-invoices", "accounting")
    .UsingJobData("Month", DateTime.Now.Month)
    .UsingJobData("Year", DateTime.Now.Year)
    .Build();

// Cron: 2:00 AM hàng ngày
ITrigger invoiceTrigger = TriggerBuilder.Create()
    .WithIdentity("process-invoices-trigger", "accounting")
    .WithCronSchedule("0 0 2 * * ?")
    .Build();

// Cron: 9h sáng thứ 6
ITrigger reminderTrigger = TriggerBuilder.Create()
    .WithIdentity("weekly-reminder-trigger", "notification")
    .WithCronSchedule("0 0 9 ? * FRI")
    .ForJob("weekly-reminder")
    .Build();

await _scheduler.ScheduleJob(invoiceJob, invoiceTrigger);
```

#### 4. Quartz Cluster

```xml
<!-- quartz.config -->
quartz.jobStore.type = Quartz.Impl.AdoJobStore.JobStoreTX, Quartz
quartz.jobStore.isClustered = true
quartz.jobStore.clusterCheckinInterval = 10000
<!-- Chỉ 1 node chạy job, node khác skip → tránh duplicate -->
```

<a id="sec-lb-storage"></a>
### Câu trả lời chi tiết: Load Balancing & File Storage

#### 1. Load Balancing — Session/JWT

```csharp
// ─── GIẢI PHÁP 1: JWT Stateless (KHUYẾN NGHỊ) ───
public string GenerateToken(User user)
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
    var token = new JwtSecurityToken(
        issuer: _settings.Issuer,
        audience: _settings.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddHours(2),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
    // JWT chứa TẤT CẢ thông tin → Server B decode, không cần session
}

// ─── GIẢI PHÁP 2: Redis Distributed Session ───
services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "redis-connection-string";
});
services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
});
```

#### 2. Presigned URL — Upload trực tiếp lên S3

```
1. Client ── GET /api/upload-url ──→ API
2. API ──── Generate Presigned URL ──→ S3
3. API ←──── Presigned URL ─────────── S3
4. Client ── PUT file (direct to S3) ─→ S3
5. Client ── POST /api/confirm-upload ─→ API
```

```csharp
public string GenerateUploadUrl(string fileName, string contentType, long fileSize)
{
    var key = $"uploads/{Guid.NewGuid()}/{fileName}";

    var request = new GetPreSignedUrlRequest
    {
        BucketName = _bucketName,
        Key = key,
        Verb = HttpVerb.PUT,
        Expires = DateTime.UtcNow.AddMinutes(15),
        ContentType = contentType,
        Headers = { ContentLength = fileSize }
    };

    return _s3Client.GetPresignedURL(request);
}

[HttpGet("api/upload-url")]
public IActionResult GetUploadUrl([FromQuery] string fileName,
                                   [FromQuery] string contentType,
                                   [FromQuery] long fileSize)
{
    if (fileSize > 50 * 1024 * 1024)
        return BadRequest("File too large");
    var presignedUrl = _uploadService.GenerateUploadUrl(fileName, contentType, fileSize);
    return Ok(new { uploadUrl = presignedUrl, key = $"uploads/.../{fileName}" });
}
```

#### 3. PDF Signature

```csharp
public async Task<string> SignPdfAsync(string fileKey, int userId)
{
    var pdfBytes = await _s3Service.GetObjectAsync(fileKey);

    using var sha256 = SHA256.Create();
    var hash = sha256.ComputeHash(pdfBytes);

    // HSM ký hash (không bao giờ export private key)
    var signature = await _hsmClient.SignAsync(
        algorithm: HsmAlgorithm.SHA256withRSA,
        data: hash,
        keyId: $"user-{userId}-signing-key");

    var signedPdf = await _pdfSigner.EmbedSignatureAsync(pdfBytes, signature,
        new SignerInfo { Name = GetUserName(userId), SignedAt = DateTime.UtcNow });

    var signedKey = fileKey.Replace("/unsigned/", "/signed/");
    await _s3Service.PutObjectAsync(signedKey, signedPdf);

    await _signatureRepo.CreateAsync(new SignatureRecord
    {
        FileKey = fileKey, SignedFileKey = signedKey,
        SignatureHash = signature.Value, SignedAt = DateTime.UtcNow
    });

    return signedKey;
}

public async Task<bool> VerifySignatureAsync(string signedFileKey)
{
    var signedPdf = await _s3Service.GetObjectAsync(signedFileKey);
    var verification = _pdfSigner.VerifySignature(signedPdf);
    if (!verification.IsValid || !verification.ContentIntegrity)
        return false;
    return true;
}
```

<a id="sec-outbox"></a>
### Câu trả lời chi tiết: Transactional Outbox Pattern (đầy đủ)

#### 1. Database Schema

```sql
CREATE TABLE OutboxMessages (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EventType NVARCHAR(256) NOT NULL,
    Payload NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(32) NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ProcessedAt DATETIME2 NULL,
    RetryCount INT NOT NULL DEFAULT 0,
    LastError NVARCHAR(MAX) NULL,
    CONSTRAINT CHK_Status CHECK (Status IN ('Pending', 'Published', 'Failed'))
);

CREATE INDEX IX_OutboxMessages_Status_CreatedAt
ON OutboxMessages (Status, CreatedAt) WHERE Status = 'Pending';
```

#### 2. UnitOfWork với Outbox Integration

```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly List<object> _outboxMessages = new();

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var message in _outboxMessages)
        {
            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventType = message.GetType().Name,
                Payload = JsonSerializer.Serialize(message),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _context.OutboxMessages.Add(outboxMessage);
        }
        _outboxMessages.Clear();
        return await _context.SaveChangesAsync(ct);
    }

    public async Task AddOutboxMessageAsync<TEvent>(TEvent @event) where TEvent : class
    {
        _outboxMessages.Add(@event);
    }
}

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, int>
{
    public async Task<int> Handle(CreateOrderCommand request)
    {
        var order = new Order(request.CustomerId);
        _uow.Orders.Add(order);

        await _uow.AddOutboxMessageAsync(new OrderCreatedEvent
        {
            OrderId = order.Id, CustomerId = order.CustomerId,
            TotalAmount = order.TotalAmount, CreatedAt = order.OrderDate
        });

        await _uow.SaveChangesAsync(); // Atomic: Order + OutboxMessage cùng commit
        return order.Id;
    }
}
```

#### 3. OutboxProcessor

```csharp
public class OutboxProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IRabbitMqService _rabbitMq;
    private readonly TimeSpan _batchInterval = TimeSpan.FromSeconds(2);
    private const int BatchSize = 100;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessOutboxBatchAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "Error processing outbox batch"); }
            await Task.Delay(_batchInterval, stoppingToken);
        }
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var messages = await db.OutboxMessages
            .Where(m => m.Status == "Pending")
            .OrderBy(m => m.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(ct);

        foreach (var message in messages)
        {
            try
            {
                var routingKey = GetRoutingKey(message.EventType);
                await _rabbitMq.PublishAsync("domain.events", routingKey, message.Payload);

                message.Status = "Published";
                message.ProcessedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                message.LastError = ex.Message;
                if (message.RetryCount >= 5)
                    message.Status = "Failed";
            }
        }
        await db.SaveChangesAsync(ct);
    }
}
```

#### 4. Idempotency Consumer

```csharp
public class OrderConsumer : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(OrderCreatedEvent @event)
    {
        var messageId = $"OrderCreated-{@event.OrderId}";

        // IDEMPOTENCY CHECK
        if (await _processedRepo.ExistsAsync(messageId))
        {
            _logger.LogInformation("Message {MessageId} already processed, skipping", messageId);
            return;
        }

        using var tran = await _inventoryService.BeginTransactionAsync();
        try
        {
            await _inventoryService.ReserveStockAsync(@event.OrderId, @event.Items);
            await _processedRepo.CreateAsync(new ProcessedMessage
            {
                MessageId = messageId, ProcessedAt = DateTime.UtcNow
            });
            await tran.CommitAsync();
        }
        catch
        {
            await tran.RollbackAsync();
            throw;
        }
    }
}
```

<a id="sec-apigw"></a>
### Câu trả lời chi tiết: API Gateway, Rate Limit & Audit

#### 1. API Gateway vs Load Balancer

```
┌──────────────────────────────────────────────────────────────────┐
│ Layer 7 (HTTP/REST)  │  NGINX / API Gateway                     │
│                       │  • Routing, Rate Limiting               │
│                       │  • JWT validation, transformation         │
│                       │  • SSL Termination, Audit logging       │
├───────────────────────┼──────────────────────────────────────────┤
│ Layer 4 (TCP)        │  HAProxy                                 │
│                       │  • Round robin, least connections        │
│                       │  • TCP health checks                    │
│                       │  • gRPC load balancing                  │
└───────────────────────┴──────────────────────────────────────────┘
```

```nginx
# NGINX Rate Limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req zone=api_limit burst=200 nodelay;

server {
    location /api/products/ {
        limit_req zone=api_limit burst=50;
        proxy_pass http://backend_services/;
    }
}
```

#### 2. Rate Limiting Algorithms

```
TOKEN BUCKET: Cho phép burst, dùng cho public APIs
  Bucket chứa N tokens. Mỗi request tiêu tốn 1 token.
  Tokens được thêm với tốc độ cố định.

LEAKY BUCKET: Smooth output, dùng cho payment/financial APIs
  Requests vào bucket, "leak" ra với tốc độ cố định.
  Bucket full → request bị reject.
```

```csharp
// Token Bucket với Redis
public async Task<bool> AllowRequestAsync(string userId)
{
    var script = @"
        local tokens = tonumber(redis.call('GET', KEYS[1]) or ARGV[1])
        local last_refill = tonumber(redis.call('GET', KEYS[2]) or ARGV[2])
        local now = tonumber(ARGV[2])
        local elapsed = now - last_refill
        local refill = elapsed * tonumber(ARGV[3])
        tokens = math.min(tonumber(ARGV[1]), tokens + refill)
        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('SET', KEYS[1], tokens)
            redis.call('SET', KEYS[2], now)
            return 1
        else return 0 end";

    var result = await _redis.ScriptEvaluateAsync(script,
        new RedisKey[] { $"ratelimit:bucket:{userId}", $"ratelimit:bucket:{userId}:last" },
        new RedisValue[] { BucketSize, DateTimeOffset.UtcNow.ToUnixTimeSeconds(), RefillRate });

    return (int)result == 1;
}
```

#### 3. Audit Log

```csharp
public class AuditInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AuditEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void AuditEntities(DbContext context)
    {
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added
                     || e.State == EntityState.Modified
                     || e.State == EntityState.Deleted);

        foreach (var entry in entries)
        {
            context.Set<AuditLog>().Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                EntityName = entry.Entity.GetType().Name,
                EntityId = GetEntityId(entry),
                Action = entry.State.ToString(),
                OldValues = entry.State == EntityState.Modified
                    ? JsonSerializer.Serialize(entry.OriginalValues.ToObject()) : null,
                NewValues = entry.State != EntityState.Deleted
                    ? JsonSerializer.Serialize(entry.CurrentValues.ToObject()) : null,
                UserId = GetCurrentUserId(),
                IpAddress = GetCurrentIpAddress(),
                Timestamp = DateTime.UtcNow,
                CorrelationId = GetCorrelationId()
            });
        }
    }
}
```

<a id="sec-grpc"></a>
### Câu trả lời chi tiết: gRPC vs REST vs RabbitMQ

#### 1. Khi nào dùng gRPC, khi nào dùng RabbitMQ?

```
DÙNG gRPC KHI:
• Cần response ngay (synchronous call)
• Tần suất gọi RẤT CAO (1000+ calls/giây)
• Internal service-to-service
• Cần streaming (video, audio, real-time data)

DÙNG RabbitMQ KHI:
• Không cần response ngay (async, fire-and-forget)
• Nhiều consumers cùng nhận 1 event (fan-out)
• Xử lý peak traffic (queue buffer)
• Module độc lập, không tight coupling

DÙNG REST KHI:
• Public API (external clients)
• Browser-based applications
• Cần Swagger/OpenAPI documentation
```

#### 2. gRPC Code Implementation

```protobuf
syntax = "proto3";
option csharp_namespace = "OrderService.Grpc";

service OrderService {
    rpc GetOrder(GetOrderRequest) returns (OrderResponse);
    rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
    rpc StreamOrderUpdates(StreamRequest) returns (stream OrderUpdate);
}

message GetOrderRequest { int32 order_id = 1; }
message OrderResponse {
    int32 id = 1; int32 customer_id = 2; string status = 3;
    repeated OrderItem items = 4; double total_amount = 5;
}
message CreateOrderRequest {
    int32 customer_id = 1; repeated OrderItemRequest items = 2;
}
```

```csharp
public class OrderGrpcService : OrderService.OrderServiceBase
{
    public override async Task<OrderResponse> GetOrder(
        GetOrderRequest request, ServerCallContext context)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId);
        return new OrderResponse
        {
            Id = order.Id, CustomerId = order.CustomerId,
            Status = order.Status, TotalAmount = order.TotalAmount
        };
    }

    // Server-side streaming
    public override async Task StreamOrderUpdates(
        StreamRequest request, IServerStreamWriter<OrderUpdate> stream,
        ServerCallContext context)
    {
        while (!context.CancellationToken.IsCancellationRequested)
        {
            var updates = await _orderRepo.GetRecentUpdatesAsync(request.CustomerId);
            foreach (var update in updates)
                await stream.WriteAsync(new OrderUpdate
                {
                    EventType = update.EventType, OrderId = update.OrderId
                });
            await Task.Delay(1000, context.CancellationToken);
        }
    }
}
```

#### 3. RabbitMQ — Message Durability

```csharp
// Durable Exchange + Queue
channel.ExchangeDeclare("domain.events", ExchangeType.Topic, durable: true);
channel.QueueDeclare("order.created", durable: true,
    arguments: new Dictionary<string, object> { { "x-message-ttl", 86400000 } });

// Persistent message
var props = channel.CreateBasicProperties();
props.Persistent = true;        // Message được lưu trên disk
props.DeliveryMode = 2;        // Persistent
props.MessageId = Guid.NewGuid().ToString();

// Manual Ack
channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);
channel.BasicConsume(queue: "order.created", autoAck: false, consumer: consumer);

consumer.Received += (model, ea) =>
{
    try {
        ProcessMessage(ea.Body.ToArray());
        channel.BasicAck(ea.DeliveryTag, multiple: false);
    }
    catch { channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false); }
};
```

<a id="sec-multidb"></a>
### Câu trả lời chi tiết: Multi-Database, Report DB & MINIO

#### 1. Database-per-Service

```
Ưu điểm:
• Độc lập hoàn toàn: team A deploy mà không ảnh hưởng team B
• Scale độc lập
• Technology heterogeneity

Nhược điểm:
• Distributed Transaction: không ACID đơn giản
  → Giải pháp: Saga Pattern
• Không JOIN cross-database
  → Giải pháp: CQRS, Eventual Consistency, Report DB riêng
• Query across services: phải qua API/gRPC
```

#### 2. Saga Pattern

```csharp
// Saga Orchestrator
public async Task<bool> CreateOrderSagaAsync(CreateOrderDto dto)
{
    var sagaId = Guid.NewGuid().ToString();
    var steps = new List<SagaStep>
    {
        new("ReserveInventory", dto.Items),
        new("CreateOrder", dto),
        new("ProcessPayment", dto.Payment)
    };

    foreach (var step in steps)
    {
        try { await ExecuteStepAsync(step, sagaId); }
        catch
        {
            // Compensating transaction: rollback
            await RollbackAsync(steps.TakeWhile(s => s != step).Reverse(), sagaId);
            return false;
        }
    }
    return true;
}

// Compensating transactions:
// CreateOrder → CancelOrder
// ReserveInventory → ReleaseInventory
// ProcessPayment → RefundPayment
```

#### 3. Report DB — CQRS Read Model

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Order DB   │ ────→ │  Outbox /   │ ────→ │  Report DB  │
│ (PostgreSQL)│       │  CDC Event   │       │ (Read Model)│
└─────────────┘       └─────────────┘       └─────────────┘
Report DB chứa DENORMALIZED data → tối ưu cho truy vấn phức tạp
Không cần JOIN nhiều bảng → query nhanh gấp 10-100 lần
```

#### 4. MINIO Object Storage

```csharp
public class MinioStorageService : IFileStorageService
{
    private readonly MinioClient _minio;

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType)
    {
        var objectName = $"{Guid.NewGuid()}/{fileName}";
        await _minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(stream, stream.Length)
            .WithContentType(contentType));
        return objectName;
    }

    public string GetPresignedUrl(string objectName, int expirySeconds = 3600)
    {
        return _minio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(_bucketName).WithObject(objectName)
            .WithExpiry(expirySeconds)).Result;
    }
}
```

<a id="sec-docker"></a>
### Câu trả lời chi tiết: Docker Swarm, ELK & Monitoring

#### 1. Docker vs VM/IIS

```
┌──────────────────────────────────────────────────────────────────┐
│ VM: Guest OS × N → Tiêu tốn ~80% RAM/CPU cho OS                │
│ Container: 1 Host OS chia sẻ → Nhẹ hơn, startup nhanh hơn      │
│ VM startup: vài phút | Container startup: vài giây               │
└──────────────────────────────────────────────────────────────────┘
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  order-service:
    image: myregistry/order-service:v2.1.0
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '0.5', memory: 512M }
      restart_policy: { condition: on-failure, delay: 5s, max_attempts: 3 }
    networks: [backend-network]

  api-gateway:
    image: myregistry/api-gateway:v1.5.0
    ports: ["80:80", "443:443"]
    deploy: { replicas: 2 }
    networks: [frontend-network, backend-network]

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    volumes: [db-data:/var/opt/mssql]
    networks: [backend-network]
```

#### 2. Correlation ID — Trace xuyên hệ thống

```csharp
public class CorrelationIdMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Response.Headers["X-Correlation-ID"] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("UserId", GetUserId(context)))
        {
            await _next(context);
        }
    }
}

// Log entry trong Elasticsearch:
/*
{
  "@timestamp": "2024-01-15T10:30:00.123Z",
  "message": "Order created successfully",
  "CorrelationId": "abc-123-def-456",
  "orderId": 1001, "duration_ms": 150
}
*/

// Query trong Kibana:
// CorrelationId: "abc-123-def-456"
// → Tìm TẤT CẢ logs của request xuyên qua OrderService → InventoryService → PaymentService
```

#### 3. Health Check & Monitoring

```csharp
services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy())
    .AddSqlServer(connectionString, name: "database", tags: new[] { "db", "critical" })
    .AddRedis(redisConnectionString, name: "redis", tags: new[] { "cache" })
    .AddRabbitMQ(new Uri("amqp://..."), name: "rabbitmq", tags: new[] { "messaging" });

// Kubernetes probes:
/*
livenessProbe:
  httpGet: { path: /health/live, port: 80 }
  initialDelaySeconds: 10; periodSeconds: 15; failureThreshold: 3
readinessProbe:
  httpGet: { path: /health/ready, port: 80 }
  initialDelaySeconds: 5; periodSeconds: 10; failureThreshold: 3
*/
```

<a id="sec-ai"></a>
### Câu trả lời chi tiết: AI, LLM, Vector DB & RAG

#### 1. LLM Integration

```csharp
public async Task<ExtractedDocument> ProcessDocumentAsync(Stream pdfStream)
{
    var text = await _ocrService.ExtractTextAsync(pdfStream, Language.Vietnamese);

    var prompt = $@"
Bạn là trợ lý trích xuất thông tin tài liệu tiếng Việt.
Hãy trích xuất các trường sau và trả về JSON:
- document_type, date, parties, contract_value, key_terms

Văn bản:
{text}

Trả về JSON:";

    var jsonResult = await _llmService.GenerateAsync(prompt);
    return JsonSerializer.Deserialize<ExtractedDocument>(jsonResult);
}

public async Task<MeetingSummary> SummarizeMinutesAsync(string minutesText)
{
    var prompt = $@"
Bạn là trợ lý tóm tắt biên bản họp.
Hãy tóm tắt thành:
1. Tóm tắt ngắn gọn (3-5 câu)
2. Các quyết định đã được đưa ra
3. Các công việc cần làm (TODO) với người phụ trách

Biên bản họp:
{minutesText}";

    return ParseMeetingSummary(await _llmService.GenerateAsync(prompt));
}
```

#### 2. Vector DB — Semantic Search

```csharp
public async Task<List<DocumentSearchResult>> SearchAsync(string query, int topK = 10)
{
    var queryVector = await _embeddingService.GetEmbeddingAsync(query);
    return await _vectorDb.SearchAsync("documents", queryVector, topK);
}

// RAG: Retrieval Augmented Generation
public async Task<string> AskQuestionAsync(string question, string userContext)
{
    var relevantDocs = await SearchAsync(question, topK: 5);
    var context = string.Join("\n\n",
        relevantDocs.Select(d => $"Document: {d.Title}\n{d.Content}"));

    var prompt = $@"
Dựa trên các tài liệu sau, hãy trả lời câu hỏi.
Nếu không tìm thấy thông tin, hãy nói rõ.

Người dùng: {userContext}

Tài liệu tham khảo:
{context}

Câu hỏi: {question}

Trả lời:";

    return await _llmService.GenerateAsync(prompt, temperature: 0.2f);
}
```

```
┌──────────────────────────────────────────────────────────────────┐
│ Relational DB: Tìm CHÍNH XÁC theo WHERE                        │
│ Vector DB: Tìm NGỮ NGHĨA (semantic similarity)                │
│   "Tìm tài liệu về BẢO MẬT THÔNG TIN"                         │
│   → Tìm cả văn bản đề cập đến "security", "data privacy"      │
│ Dùng cho: RAG chatbot, similarity search, recommendation      │
└──────────────────────────────────────────────────────────────────┘
```

<a id="sec-security"></a>
### Câu trả lời chi tiết: Security, RBAC/ABAC & Backup

#### 1. OAuth2 + OpenID Connect

```
1. User click "Login" → Redirect đến IdP (Keycloak/Azure AD)
2. User nhập credentials → IdP validate → Redirect về /callback?code=AUTH_CODE
3. Backend exchange code lấy tokens: { access_token, id_token, refresh_token }
4. Access token dùng để gọi API
5. API validate token (signature, expiry, audience)
```

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        options.Authority = "https://login.microsoftonline.com/{tenant-id}/v2.0";
        options.ClientId = "{client-id}";
    });
```

#### 2. RBAC + ABAC Hybrid

```csharp
public async Task<bool> CanAccessAsync(User user, string resource, string action,
    object resourceData = null)
{
    // RBAC: Kiểm tra Role-based permissions
    var rolePermissions = await _roleRepo.GetPermissionsAsync(user.Roles);
    if (rolePermissions.Contains($"{resource}.{action}"))
        return true;

    // ABAC: Kiểm tra Attribute-based permissions
    if (user.Roles.Any(r => r.Name == "Manager"))
    {
        if (resourceData is Order order)
            return user.DepartmentId == order.DepartmentId; // Manager chỉ truy cập phòng mình
    }

    return false;
}
```

#### 3. Backup Strategy

```sql
-- Full backup hàng ngày
BACKUP DATABASE [OrderDB] TO DISK = '\\backup-server\OrderDB\full_backup.bak'
WITH COMPRESSION, CHECKSUM;

-- Transaction log backup mỗi 15 phút
BACKUP LOG [OrderDB] TO DISK = '\\backup-server\OrderDB\log_backup.trn'
WITH COMPRESSION;
```

```yaml
# Kubernetes CronJob cho backup
apiVersion: batch/v1
kind: CronJob
metadata: { name: database-backup }
spec:
  schedule: "0 1 * * *"  # 1h sáng hàng ngày
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mssql-tools:latest
            command: ["/bin/bash", "-c", |
                /opt/mssql-tools/bin/sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS \
                -Q "BACKUP DATABASE [$DB_NAME] TO DISK='/backup/$DB_NAME.bak' WITH COMPRESSION"
                aws s3 cp /backup/$DB_NAME.bak s3://$BUCKET/db-backups/$DB_NAME-$(date +%Y%m%d).bak
            ]
          restartPolicy: OnFailure
```

<a id="sec-workflow"></a>
### Câu trả lời chi tiết: Document Management & Dynamic Workflow

#### 1. Luồng luân chuyển văn bản

```
Tiếp nhận → Phân xử lý → Xử lý → Trình ký → Ban hành
    ↓            ↓           ↓          ↓           ↓
 Đăng ký   Chỉ định     Soạn thảo   Lãnh đạo    Công khai
 văn bản   người/phòng  hoàn thành   ký duyệt    phát hành
```

#### 2. Dynamic Workflow — Database Design

```sql
CREATE TABLE Workflows (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(256) NOT NULL,
    Code NVARCHAR(64) NOT NULL UNIQUE,
    DocumentType NVARCHAR(128),
    IsActive BIT NOT NULL DEFAULT 1
);

CREATE TABLE WorkflowSteps (
    Id INT PRIMARY KEY IDENTITY,
    WorkflowId INT NOT NULL REFERENCES Workflows(Id),
    StepOrder INT NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    StepType NVARCHAR(32) NOT NULL,  -- Approval, Review, Sign, Notify
    AssignedType NVARCHAR(32) NOT NULL, -- User, Role, Department, Dynamic
    AssignedValue NVARCHAR(256),
    TimeLimitHours INT,
    AllowReject BIT NOT NULL DEFAULT 1,
    RejectToStepId INT NULL REFERENCES WorkflowSteps(Id),
    IsFinalStep BIT NOT NULL DEFAULT 0
);

CREATE TABLE WorkflowTransitions (
    Id INT PRIMARY KEY IDENTITY,
    WorkflowId INT NOT NULL REFERENCES Workflows(Id),
    FromStepId INT NOT NULL REFERENCES WorkflowSteps(Id),
    ToStepId INT NOT NULL REFERENCES WorkflowSteps(Id),
    TriggerType NVARCHAR(32) NOT NULL,  -- Approve, Reject, Timeout, Auto
    Condition NVARCHAR(MAX) NULL  -- JSON: điều kiện chuyển bước
);
```

#### 3. Workflow Engine

```csharp
public async Task<int> StartWorkflowAsync(int workflowId, int documentId)
{
    var workflow = await _workflowRepo.GetWithStepsAsync(workflowId);
    var firstStep = workflow.Steps.OrderBy(s => s.StepOrder).First();

    var instance = new WorkflowInstance
    {
        WorkflowId = workflowId, DocumentId = documentId,
        CurrentStepId = firstStep.Id, Status = "Running"
    };
    await _workflowRepo.CreateInstanceAsync(instance);

    var stepInstance = new WorkflowStepInstance
    {
        InstanceId = instance.Id, StepId = firstStep.Id,
        AssignedUserId = await ResolveAssigneeAsync(firstStep),
        Status = "Pending", AssignedAt = DateTime.UtcNow,
        Deadline = DateTime.UtcNow.AddHours(firstStep.TimeLimitHours)
    };
    await _stepRepo.CreateAsync(stepInstance);

    await _notificationService.NotifyAsync(stepInstance);
    return instance.Id;
}

public async Task<bool> ProcessStepAsync(int stepInstanceId, string action,
    string comment, int userId)
{
    var stepInstance = await _stepRepo.GetByIdAsync(stepInstanceId);
    stepInstance.Status = action == "Approve" ? "Approved" : "Rejected";
    stepInstance.CompletedAt = DateTime.UtcNow;
    stepInstance.CompletedByUserId = userId;
    stepInstance.Comment = comment;
    await _stepRepo.UpdateAsync(stepInstance);

    if (action == "Reject" && stepInstance.Step.RejectToStepId != null)
        await MoveToStepAsync(stepInstance.InstanceId, stepInstance.Step.RejectToStepId.Value);
    else if (action == "Approve")
    {
        var transition = await _workflowRepo.GetNextTransitionAsync(
            stepInstance.InstanceId, "Approve");
        if (transition != null)
            await MoveToStepAsync(stepInstance.InstanceId, transition.ToStepId);
        else
            await CompleteWorkflowAsync(stepInstance.InstanceId);
    }
    return true;
}
```

<a id="sec-concurrency"></a>
### Câu trả lời chi tiết: Concurrency Control

#### 1. Optimistic Concurrency Control (RowVersion)

```csharp
public class RoomBooking
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string BookedBy { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } // Auto-generated by SQL Server
}

public async Task<bool> BookRoomAsync(int roomId, DateTime start, DateTime end, string bookedBy)
{
    var conflict = await _context.RoomBookings
        .AnyAsync(b => b.RoomId == roomId && b.StartTime < end && b.EndTime > start);
    if (conflict) return false;

    _context.RoomBookings.Add(new RoomBooking { RoomId = roomId, StartTime = start, EndTime = end, BookedBy = bookedBy });
    try
    {
        await _context.SaveChangesAsync();
        return true;
    }
    catch (DbUpdateConcurrencyException ex)
    {
        // Concurrency conflict! Có ai đó đặt cùng phòng cùng lúc
        throw new ConcurrencyConflictException(
            "Phòng đã được đặt bởi người khác. Vui lòng chọn thời gian khác.");
    }
}
```

```sql
ALTER TABLE RoomBookings ADD RowVersion rowversion NOT NULL
```

#### 2. Pessimistic Locking

```csharp
public async Task<bool> BookRoomPessimisticAsync(int roomId, DateTime start, DateTime end, string bookedBy)
{
    using var tran = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    try
    {
        var conflict = await _context.RoomBookings
            .FromSqlRaw(@"
                SELECT * FROM RoomBookings WITH (UPDLOCK, HOLDLOCK)
                WHERE RoomId = {0} AND StartTime < {2} AND EndTime > {1}",
                roomId, start, end)
            .AnyAsync();

        if (conflict) { await tran.RollbackAsync(); return false; }

        _context.RoomBookings.Add(new RoomBooking { RoomId = roomId, StartTime = start, EndTime = end, BookedBy = bookedBy });
        await _context.SaveChangesAsync();
        await tran.CommitAsync();
        return true;
    }
    catch { await tran.RollbackAsync(); throw; }
}
```

```
┌──────────────────────────────────────────────────────────────────┐
│ OPTIMISTIC LOCKING (RowVersion)                                  │
│ • Không khóa row → nhiều user đọc cùng lúc được                │
│ • Chỉ kiểm tra khi ghi                                         │
│ • Phù hợp: Tần suất conflict THẤP                              │
├──────────────────────────────────────────────────────────────────┤
│ PESSIMISTIC LOCKING (UPDLOCK)                                   │
│ • Khoá row ngay khi đọc → ngăn other transactions ghi           │
│ • An toàn tuyệt đối                                            │
│ • Phù hợp: Tần suất conflict CAO (phòng họp hot, cao điểm)   │
└──────────────────────────────────────────────────────────────────┘
```

<a id="sec-integration"></a>
### Câu trả lời chi tiết: Integration, LDAP & Notifications

#### 1. Kết nối Trục Văn bản Quốc gia (VBDQ)

```csharp
public class VbdqClient
{
    public async Task<VbdqSendResult> SendVanBanDenAsync(VanBanDen vanBan)
    {
        var message = new VbdqMessage
        {
            MessageId = Guid.NewGuid().ToString(),
            MessageType = "VBDQ_VAN_BAN_DEN",
            SenderOrgCode = _orgCode,
            ReceiverOrgCode = vanBan.CoQuanBanHanh,
            Payload = vanBan
        };

        var xmlPayload = _serializer.SerializeToXml(message);
        var response = await _httpClient.PostAsync("/api/vbdq/vanban/send",
            new StringContent(xmlPayload, Encoding.UTF8, "application/xml"));

        if (response.IsSuccessStatusCode)
        {
            var ackXml = await response.Content.ReadAsStringAsync();
            return _serializer.DeserializeFromXml<VbdqSendResult>(ackXml);
        }
        throw new VbdqException($"Send failed: {response.StatusCode}");
    }
}

[HttpPost("api/webhook/vbdq")]
public async Task<IActionResult> ReceiveFromVbdq([FromBody] string xmlPayload)
{
    var message = _serializer.DeserializeFromXml<VbdqMessage>(xmlPayload);
    if (!_signatureValidator.Validate(xmlPayload, message.SenderOrgCode))
        return Unauthorized("Invalid signature");

    switch (message.MessageType)
    {
        case "VBDQ_VAN_BAN_DEN":
            await _documentService.ProcessIncomingDocumentAsync((VanBanDen)message.Payload);
            break;
        case "VBDQ_LICH_CONG_TAC":
            await _scheduleService.ProcessScheduleAsync((LichCongTac)message.Payload);
            break;
    }
    return Ok();
}
```

#### 2. LDAP/AD Integration

```csharp
public async Task<List<AdUser>> SyncUsersAsync()
{
    var searchRequest = new SearchRequest(
        _baseDn,
        "(objectClass=user)",
        SearchScope.Subtree,
        "cn", "mail", "department", "memberOf");

    var results = await Task.Run(() => _connection.SendRequest(searchRequest));
    var users = new List<AdUser>();

    foreach (SearchResultEntry entry in results.Entries)
        users.Add(new AdUser
        {
            SamAccountName = entry.Attributes["cn"][0]?.ToString(),
            Email = entry.Attributes["mail"][0]?.ToString(),
            Department = entry.Attributes["department"][0]?.ToString(),
            Groups = entry.Attributes["memberOf"].Cast<string>().ToList()
        });

    return users;
}

public async Task<bool> ProvisionUserAsync(string samAccountName)
{
    var adUser = await GetAdUserAsync(samAccountName);
    var existingUser = await _userRepo.FindByEmailAsync(adUser.Email);
    if (existingUser != null) return true;

    var newUser = new ApplicationUser
    {
        Username = adUser.SamAccountName,
        Email = adUser.Email,
        AdObjectSid = adUser.Sid,
        AutoSyncWithAd = true
    };

    var roles = MapAdGroupsToRoles(adUser.Groups);
    foreach (var role in roles) newUser.Roles.Add(role);

    await _userRepo.CreateAsync(newUser);
    return true;
}
```

#### 3. Notification Service với RabbitMQ

```
Core Service ──publish──→ notifications.fanout ──┬──→ [queue:email] ──→ SMTP
                           │                     ├──→ [queue:sms] ────→ SMS Gateway
                           │                     └──→ [queue:push] ───→ Firebase
```

```csharp
public class NotificationPublisher : INotificationPublisher
{
    public async Task PublishEmailAsync(string to, string subject, string body)
    {
        var payload = new EmailNotification
        {
            Id = Guid.NewGuid().ToString(), To = to,
            Subject = subject, Body = body, CreatedAt = DateTime.UtcNow
        };

        await _channel.BasicPublishAsync(
            exchange: "notifications.fanout",
            routingKey: "email",
            mandatory: true,
            basicProperties: new BasicProperties
            {
                Persistent = true, ContentType = "application/json",
                Priority = 5, Expiration = "86400000"
            },
            body: Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload)));
    }
}

public class EmailWorker : BackgroundService
{
    private readonly SemaphoreSlim _rateLimiter = new(100); // 100 emails/phút
    private readonly int _maxPerMinute = 100;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (model, ea) =>
        {
            try
            {
                await _rateLimiter.WaitAsync(stoppingToken);
                var email = JsonSerializer.Deserialize<EmailNotification>(
                    Encoding.UTF8.GetString(ea.Body.ToArray()));
                await _emailSender.SendAsync(email);
                _channel.BasicAck(ea.DeliveryTag, false);
                _ = Task.Run(async () =>
                {
                    await Task.Delay(TimeSpan.FromMinutes(1));
                    _rateLimiter.Release();
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email");
                _channel.BasicNack(ea.DeliveryTag, false, ShouldRequeue(ea));
            }
        };
        _channel.BasicConsume(queue: "email", autoAck: false, consumer: consumer);
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}
```

**Tip phỏng vấn tổng hợp:** Khi trả lời nhiều câu hỏi liên tiếp, hãy liên kết chúng. Khi nói về CQRS, dẫn chứng đến Report DB, Read/Write Replication, gRPC/RabbitMQ. Khi nói về Security, liên kết đến MFA trong OAuth2, JWT token trong Load Balancing, Redis blacklist. Điều này thể hiện tư duy hệ thống (System Thinking) — phẩm chất quan trọng của Senior Architect.

**1.2. Clean Architecture, CQRS & DDD (Điểm mạnh trong CV của bạn)**
- **Clean Architecture:** Cấu trúc các project (Domain, Application, Infrastructure, Web API) tương tác với nhau thế nào? Dependency Inversion Principle (DIP) áp dụng ra sao trong kiến trúc này?
- **CQRS kết hợp MediatR:** Lợi ích của việc tách biệt thao tác Đọc (Read - Queries) và Ghi (Write - Commands). Tại sao bạn lại chọn CQRS cho dự án ERP?
- **DDD (Domain-Driven Design):** Bạn hiểu thế nào về *Aggregate Roots*, *Value Objects*, *Domain Events*? Cách bạn thiết kế một Domain Entity chuẩn để không bị lệ thuộc vào Entity Framework.

---

## 2. Lớp Dữ liệu & Tối ưu hóa (Database Optimization)

*CV của bạn đặc biệt nhấn mạnh về việc tối ưu hóa SQL, giải quyết Deadlock, và dùng Dapper.*

**2.1. Entity Framework Core vs Dapper**
- Khi nào dùng EF Core, khi nào dùng Dapper? (Gợi ý: Bạn kết hợp EF Core cho Command (Ghi) để tận dụng tracking/Transaction, và Dapper cho Queries (Đọc)/Báo cáo để tối ưu hiệu năng).
- Lỗi **N+1 Queries** trong EF Core là gì? Cách khắc phục (Dùng `Include`, `ThenInclude`, hoặc Lazy Loading/Eager Loading).

**2.2. Tối ưu SQL Server & Giải quyết Deadlock**
- Trình bày một trường hợp thực tế bạn đã xử lý **Deadlock** ở công ty HopLongTech. 
  - *Giải thích sâu:* Deadlock xảy ra khi nào? (Ví dụ: 2 transaction cùng Update 2 bảng nhưng ngược thứ tự).
  - *Cách giải quyết:* Thay đổi thứ tự truy xuất bảng, thu nhỏ kích thước Transaction, hoặc dùng các Query Hints (như `WITH (NOLOCK)` cho các báo cáo không quan trọng tính nhất quán 100%).
- Các loại **Index** (Clustered vs Non-Clustered). Khi nào Index không có tác dụng (Table Scan)? 
- Kinh nghiệm cấu hình **Read/Write Replication** ở MobiFoneIT: Làm sao để định tuyến request đọc sang DB Replica, request ghi sang DB Master?

---

## 3. Kiến trúc Hệ thống & Messaging (System & Integration)

**3.1. RabbitMQ, Redis & Real-time (SignalR)**
- **RabbitMQ:** Phân biệt các Exchange (Direct, Topic, Fanout). Cách xử lý khi một message không thể tiêu thụ (Dead Letter Queue - DLQ), cách Retry message.
- Ứng dụng tích hợp RabbitMQ và SignalR (Dự án ở AgileTech): Khi Background Job chạy xong, làm sao để đẩy thông báo realtime về đúng client qua SignalR?
- **Redis:** Dùng Redis để chặn login trái phép đa thiết bị (ví dụ: lưu blacklist token, hoặc mỗi user id chỉ map với 1 access token duy nhất, token mới ghi đè token cũ).

**3.2. Background Jobs (Quartz.NET)**
- Tại sao dùng Quartz thay vì `IHostedService` có sẵn của .NET? (Quartz hỗ trợ lập lịch cron phức tạp, quản lý job retry, clustered execution).

**3.3. Load Balancing & File Storage**
- Cách deploy IIS song song có Load Balancing (MobiFoneIT): Xử lý vấn đề chia sẻ Session/Token JWT thế nào giữa các node? (Sử dụng JWT stateless hoặc Redis distributed cache).
- AWS S3 và MinIO cho File Storage: Ứng dụng kỹ thuật Presigned URL để upload trực tiếp từ Client lên S3 thay vì qua API backend. Cách xử lý Ký số trên file PDF.

---
---

## 4. XỬ LÝ ĐỒNG BỘ DỮ LIỆU: THE OUTBOX PATTERN 
*(Rất quan trọng cho các hệ thống dùng RabbitMQ)*

### Vấn đề: Tình huống "Dual-Write"
Trong ứng dụng ERP của bạn, giả sử khi tạo một Đơn hàng (`Command` trong CQRS), bạn cần:
1. Lưu Đơn hàng vào CSDL (SQL Server).
2. Gửi một Message qua **RabbitMQ** để báo cho module Kho (Inventory) trừ số lượng.

Nếu lưu DB thành công nhưng lỗi mạng khiến việc gửi Message thất bại, dữ liệu giữa các module sẽ bị lệch. Sử dụng C# Transaction bình thường (`IDbContextTransaction`) không thể rollback được RabbitMQ.

### Giải pháp: Transactional Outbox Pattern với EF Core
Thay vì gọi trực tiếp RabbitMQ, bạn ghi log sự kiện vào một bảng `OutboxMessage` nằm cùng CSDL với bảng Đơn hàng.

**Luồng Ghi (Write):**
1. Ứng dụng khởi tạo Transaction.
2. Thêm mới bản ghi Đơn hàng vào DB (`_dbContext.Orders.Add()`).
3. Thêm một Event vào bảng Outbox (`_dbContext.OutboxMessages.Add(new OutboxMessage { Event = "OrderCreated", Status = "Pending" })`).
4. Gọi `_dbContext.SaveChanges()`. Vì EF Core thực thi các lệnh trong cùng một request vào một database transaction ngầm định, cả 2 hành động sẽ cùng thành công hoặc cùng thất bại (Atomic).

**Luồng Gửi (Relay - Sử dụng Quartz/BackgroundService):**
5. Bạn viết một Job (ví dụ bằng Quartz) chạy ngầm mỗi 2 giây, quét bảng `OutboxMessage` tìm các dòng có trạng thái `Pending`.
6. Lấy dữ liệu đó publish lên RabbitMQ.
7. Nếu gửi thành công, cập nhật trạng thái dòng đó thành `Published` hoặc xóa khỏi bảng `Outbox`.

### Cực kỳ quan trọng: Idempotency (Lũy đẳng) ở Service nhận
Pattern này có thể dẫn đến việc gửi trùng Message (do lỗi mạng lúc update chữ `Published`).
Do đó, ở Module Kho nhận Message, bạn phải thiết kế logic **Idempotent**:
- Mỗi Message có 1 `MessageId` duy nhất.
- Khi nhận Message, query DB xem `MessageId` này đã được xử lý chưa (lưu bảng `ProcessedMessages`).
- Nếu đã xử lý, return (Bỏ qua).
- Nếu chưa, tiến hành trừ kho và lưu `MessageId` lại (tất cả trong 1 transaction).

---

---

## 5. Kiến thức Công nghệ mở rộng (Từ Sơ đồ Kiến trúc)

**5.1. Lớp Truy cập & API Gateway**
- **API Gateway & NGINX:** Tại sao cần API Gateway đứng trước Microservices? Phân biệt Load Balancer Lớp truy cập (NGINX/API Gateway - xử lý HTTP/REST, Rate Limit, Audit Access) và Load Balancer Nội bộ (HAProxy - cân bằng tải TCP/gRPC ở lớp hạ tầng).
- **Rate Limit & Audit Access:** Các thuật toán giới hạn request (Token Bucket, Leaky Bucket). Cách thiết kế cơ chế lưu Audit Log cho mọi luồng dữ liệu đi vào hệ thống.

**5.2. Giao tiếp Nội bộ & Trục tích hợp**
- **gRPC (Internal Service-to-Service):** Sự khác biệt giữa gRPC (sử dụng HTTP/2, Protobuf dạng nhị phân, hiệu năng cao) và REST API truyền thống. Khi nào các service nên gọi nhau đồng bộ bằng gRPC, và khi nào nên đẩy bất đồng bộ qua RabbitMQ?
- **RabbitMQ (Trục tích hợp nội bộ):** Cơ chế Pub/Sub, Work Queue. Cách đảm bảo không mất thông điệp (Message Durability) và xử lý Dead Letter Exchange.

**5.3. Lớp Dữ liệu Đa tầng (Data Layer)**
- **PostgreSQL Multi Database:** Phân tích kiến trúc Database-per-service (mỗi service quản lý 1 DB riêng). Điểm mạnh và điểm yếu (Đặc biệt là vấn đề Distributed Transaction).
- **Report DB:** Tại sao sơ đồ lại tách riêng một DB chỉ để phục vụ Report? (Đây là cốt lõi của **CQRS**: Dữ liệu từ các service khác sẽ được đồng bộ về Report DB để tối ưu hóa truy vấn báo cáo phức tạp).
- **MINIO Object Storage:** Cách lưu trữ tệp tin tĩnh (văn bản, PDF, hình ảnh) bằng chuẩn S3. Xử lý bài toán upload file dung lượng lớn và presigned URL.

**5.4. Lớp Hạ tầng & Giám sát (Infrastructure & Observability)**
- **Docker Swarm & Container Orchestration:** Khác biệt giữa chạy ứng dụng bằng Docker so với máy ảo/IIS truyền thống. Cách Docker Swarm tự động hóa Service Discovery và Routing.
- **ELK Stack (Elasticsearch, Logstash, Kibana) & Tracing:** Quản lý Operation Logging tập trung. Làm sao để truy vết (Trace ID / Correlation ID) một hành động của người dùng khi nó chạy xuyên qua API Gateway $\rightarrow$ gRPC $\rightarrow$ nhiều DB khác nhau?
- **Giám sát (Monitoring):** Cơ chế Health Check cho từng Microservice. Cảnh báo khi hệ thống quá tải (CPU/RAM/RabbitMQ Queue depth).

**5.5. Trí tuệ Nhân tạo (AI & LLM)**
- **AI Assistant Service & LLM Model:** Cách ứng dụng mô hình ngôn ngữ lớn (LLM) để thực hiện OCR tiếng Việt, trích xuất thông tin, tóm tắt biên bản họp tự động và gợi ý xử lý công việc.
- **Vector DB:** Khác biệt hoàn toàn so với Relational DB. Nó lưu trữ dữ liệu dưới dạng "Vector Embedding" và cho phép tìm kiếm tài liệu dựa trên ngữ nghĩa (Semantic Search) thay vì chỉ tìm theo từ khóa. Đây là nền tảng của kỹ thuật **RAG** (Retrieval-Augmented Generation) cho Chatbot.

**5.6. Bảo mật Toàn diện (Security & Identity)**
- **Authentication (Định danh):** Hiểu rõ cơ chế SSO, OAuth2. Đánh giá bảo mật với MFA (Xác thực đa yếu tố) và tích hợp Active Directory (LDAP/AD).
- **Ký số (Signature Service):** Cách tích hợp Token, SIM PKI và hệ thống HSM phần cứng để thực hiện ký số xác thực tính toàn vẹn của tệp PDF (File Service).
- **Phân quyền Đa cấp (RBAC/ABAC) & Sao lưu:** Cấu trúc phân quyền linh hoạt theo từng phòng ban, bộ, ngành. Quy trình thiết lập Sao lưu (Backup) đồng bộ cho kiến trúc Multi-Database.

---

## 6. Kiến thức Nghiệp vụ Hệ thống (Business Domains)

*Hệ thống quản lý trong ảnh tập trung mạnh vào Khối Hành chính công / Quản trị nội bộ (Document Management / ERP).*

**6.1. Nghiệp vụ Quản lý Văn bản (Document Service)**
- **Luồng luân chuyển:** Văn bản đến, Văn bản đi, Tờ trình nội bộ. Nắm vững các bước vòng đời: Tiếp nhận $\rightarrow$ Phân xử lý $\rightarrow$ Xử lý $\rightarrow$ Trình ký $\rightarrow$ Ban hành.
- **Quy trình động (Dynamic Workflow):** Thiết kế database thế nào để cho phép Admin tự định nghĩa các bước duyệt văn bản mà developer không phải sửa code? (Thiết kế các bảng cấu trúc node/cạnh: `Workflow`, `WorkflowStep`, `WorkflowTransition`).

**6.2. Nghiệp vụ Hành chính & Lịch biểu (Office Manage & Booking Service)**
- **Booking (Phòng họp, Xe):** Bài toán *tranh chấp dữ liệu (Concurrency)* khi 2 cán bộ cùng đặt một phòng họp tại cùng một thời điểm. Áp dụng Optimistic Concurrency Control (RowVersion) hoặc Pessimistic Locking trong EF Core/SQL Server như thế nào?
- Hệ thống "Họp không giấy" (e-Cabinet), Quản lý lịch công tác Lãnh đạo, chấm công, nghỉ phép.

**6.3. Trục tích hợp liên thông (Integration Service & Hệ thống ngoài)**
- **Kết nối Trục Văn bản Quốc gia (VBDQ):** Hiểu về chuẩn đóng gói dữ liệu XML/JSON, kỹ năng xử lý gửi/nhận bất đồng bộ thông điệp giữa các Bộ ban ngành thông qua Trục liên thông.
- **Kết nối LDAP/AD:** Quản trị tập trung, đồng bộ cơ cấu tổ chức và tự động cấp phát tài khoản (User provisioning).
- **Notification Service:** Cách quy hoạch queue trong RabbitMQ để đẩy hàng ngàn Email, SMS và Push Notification (In-app) mà không làm nghẽn hệ thống.

---

## Lời khuyên cuối cho buổi phỏng vấn
- Bạn có một nền tảng rất vững và "thực chiến". Khi phỏng vấn, hãy chủ động kể các câu chuyện (Storytelling) theo mô hình **STAR** (Situation - Task - Action - Result). 
- *Ví dụ:* "Khi ở HopLongTech làm hệ thống ERP (**Situation**), báo cáo xuất ra rất chậm và DB bị deadlocks (**Task**). Tôi đã sử dụng SQL Profiler phân tích, viết lại bằng Dapper kết hợp đánh lại Index cho các bảng join lớn, đồng thời sắp xếp lại thứ tự update để tránh lock escalation (**Action**). Kết quả thời gian xuất báo cáo giảm 70% và hết hẳn lỗi deadlock (**Result**)."
