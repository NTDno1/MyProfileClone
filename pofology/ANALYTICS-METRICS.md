# Analytics Metrics - Các thông số có thể thu thập

## Thông số hiện tại đang thu thập ✅

1. **IP Address** - Địa chỉ IP của user
2. **Country** - Quốc gia
3. **City** - Thành phố
4. **Device Type** - Loại thiết bị (mobile/desktop/tablet)
5. **Browser** - Trình duyệt
6. **Browser Version** - Phiên bản trình duyệt
7. **OS** - Hệ điều hành
8. **Page** - Trang đang truy cập
9. **Referrer** - Trang nguồn (nơi user đến từ đâu)
10. **User Agent** - User agent string đầy đủ
11. **Session ID** - ID phiên làm việc
12. **Is New Visitor** - Là visitor mới hay không
13. **Time on Page** - Thời gian ở trên trang (giây)
14. **Timestamp** - Thời gian truy cập

---

## Thông số bổ sung có thể thu thập 🔍

### 1. Thông tin màn hình và thiết bị

```javascript
// Screen Resolution
screenWidth: window.screen.width
screenHeight: window.screen.height
screenColorDepth: window.screen.colorDepth
screenPixelDepth: window.screen.pixelDepth

// Viewport Size
viewportWidth: window.innerWidth
viewportHeight: window.innerHeight

// Device Pixel Ratio (cho Retina displays)
devicePixelRatio: window.devicePixelRatio

// Orientation (mobile)
orientation: screen.orientation?.angle || window.orientation
```

### 2. Thông tin mạng và hiệu suất

```javascript
// Connection Info (Network Information API)
connectionType: navigator.connection?.effectiveType // '4g', '3g', '2g', 'slow-2g'
connectionDownlink: navigator.connection?.downlink // Mbps
connectionRTT: navigator.connection?.rtt // Round-trip time (ms)
connectionSaveData: navigator.connection?.saveData // true/false

// Performance Timing
pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
domContentLoadedTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
firstPaint: performance.getEntriesByType('paint')[0]?.startTime
firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
```

### 3. Thông tin ngôn ngữ và vùng

```javascript
// Language
language: navigator.language // 'vi-VN', 'en-US'
languages: navigator.languages // ['vi-VN', 'vi', 'en-US', 'en']
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // 'Asia/Ho_Chi_Minh'
timezoneOffset: new Date().getTimezoneOffset() // -420 (minutes)

// Locale
locale: navigator.language
```

### 4. Thông tin trình duyệt nâng cao

```javascript
// Browser Capabilities
cookieEnabled: navigator.cookieEnabled
doNotTrack: navigator.doNotTrack // '1' or null
hardwareConcurrency: navigator.hardwareConcurrency // CPU cores
maxTouchPoints: navigator.maxTouchPoints // Touch support
platform: navigator.platform // 'MacIntel', 'Win32'
vendor: navigator.vendor // 'Google Inc.', 'Apple Computer, Inc.'
webdriver: navigator.webdriver // true if automated browser

// Media Capabilities
mediaDevices: navigator.mediaDevices ? 'supported' : 'not-supported'
```

### 5. Thông tin vị trí (nếu user cho phép)

```javascript
// Geolocation (requires permission)
latitude: position.coords.latitude
longitude: position.coords.longitude
accuracy: position.coords.accuracy
altitude: position.coords.altitude
```

### 6. Thông tin phiên và hành vi

```javascript
// Session Info
sessionStartTime: Date.now() // Khi session bắt đầu
pageViewCount: // Số lần xem trang trong session
previousPage: // Trang trước đó
nextPage: // Trang tiếp theo (nếu có)
scrollDepth: // Độ sâu scroll (0-100%)
exitIntent: // User có cố gắng rời trang không

// Engagement Metrics
clicks: // Số lần click
formSubmissions: // Số lần submit form
videoPlays: // Số lần play video
downloads: // Số lần download file
```

### 7. Thông tin từ Server Headers

```javascript
// HTTP Headers (server-side)
acceptLanguage: req.headers['accept-language']
acceptEncoding: req.headers['accept-encoding']
accept: req.headers['accept']
xForwardedFor: req.headers['x-forwarded-for'] // Real IP behind proxy
xRealIP: req.headers['x-real-ip']
cfRay: req.headers['cf-ray'] // Cloudflare
cfCountry: req.headers['cf-ipcountry'] // Cloudflare country
```

### 8. Thông tin từ Referrer

```javascript
// Parse referrer để lấy thêm thông tin
referrerDomain: new URL(referrer).hostname // 'facebook.com'
referrerPath: new URL(referrer).pathname // '/page'
isSearchEngine: // true nếu đến từ Google, Bing, etc.
searchQuery: // Query string từ search engine
searchEngine: // 'google', 'bing', 'yahoo', etc.
```

### 9. Thông tin thiết bị chi tiết (từ User Agent)

```javascript
// Parse User Agent để lấy:
deviceModel: // 'iPhone 12', 'Samsung Galaxy S21'
deviceBrand: // 'Apple', 'Samsung'
cpuArchitecture: // 'x64', 'arm64'
isBot: // true nếu là bot/crawler
isMobileApp: // true nếu là in-app browser (Facebook, Instagram, etc.)
```

### 10. Thông tin bảo mật

```javascript
// Security
isHTTPS: window.location.protocol === 'https:'
isSecureContext: window.isSecureContext
```

### 11. Thông tin tương tác

```javascript
// User Interactions
mouseMovements: // Số lần di chuyển chuột
keyStrokes: // Số lần gõ phím
touchEvents: // Số lần touch (mobile)
focusTime: // Thời gian tab được focus
blurTime: // Thời gian tab bị blur
```

### 12. Thông tin từ Social Media (nếu có)

```javascript
// Social Media Referrer
isFacebook: referrer.includes('facebook.com')
isInstagram: referrer.includes('instagram.com')
isTwitter: referrer.includes('twitter.com')
isLinkedIn: referrer.includes('linkedin.com')
socialPlatform: // 'facebook', 'instagram', etc.
```

---

## Ví dụ: Thông số mở rộng cho Facebook In-App Browser

Từ userAgent của bạn:
```
Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20B82 [FBAN/FBIOS;FBAV/527.0.0.42.97;FBBV/780115200;FBDV/iPhone12,5;FBMD/iPhone;FBSN/iOS;FBSV/16.1;FBSS/3;FBID/phone;FBLC/vi_VN;FBOP/5;FBRV/784433750;IABMV/1]
```

Có thể extract thêm:
- **Facebook App Version**: 527.0.0.42.97
- **Device Model**: iPhone12,5 (iPhone 11 Pro Max)
- **iOS Version**: 16.1
- **Facebook Language**: vi_VN
- **Is In-App Browser**: true
- **Social Platform**: facebook
- **App Type**: mobile app

---

## Khuyến nghị: Thông số nên thêm

### Priority 1 (Quan trọng nhất):
1. **Screen Resolution** - Phân tích responsive design
2. **Viewport Size** - Kích thước màn hình thực tế
3. **Referrer Domain** - Domain nguồn (facebook.com, google.com)
4. **Is Search Engine** - Đến từ search engine không
5. **Search Query** - Từ khóa tìm kiếm (nếu có)
6. **Page Load Time** - Hiệu suất trang
7. **Language** - Ngôn ngữ trình duyệt

### Priority 2 (Hữu ích):
8. **Connection Type** - 4G, 3G, WiFi
9. **Timezone** - Múi giờ
10. **Device Pixel Ratio** - Retina display
11. **Scroll Depth** - User có scroll không
12. **Exit Intent** - User có cố rời trang không

### Priority 3 (Nâng cao):
13. **First Paint Time** - Thời gian render đầu tiên
14. **Hardware Concurrency** - Số CPU cores
15. **Is Bot** - Có phải bot không
16. **Social Platform** - Platform social media

---

## Lưu ý về Privacy

⚠️ **Quan trọng**: Một số thông số cần permission của user:
- Geolocation (latitude/longitude) - Cần user cho phép
- Camera/Microphone - Cần user cho phép

✅ **An toàn**: Các thông số khác có thể thu thập mà không cần permission.

