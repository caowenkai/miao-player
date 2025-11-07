# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

## 响应格式

所有 API 响应遵循以下格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

## 歌曲管理 API

### 1. 获取歌曲列表

**请求**

```
GET /api/songs
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索关键词（歌曲名、艺术家、专辑） |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "id": 1,
        "title": "歌曲名称",
        "artist": "艺术家",
        "album": "专辑",
        "duration": 240,
        "file_path": "1234567890.mp3",
        "file_name": "原始文件名.mp3",
        "lyrics": "歌词内容",
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 2. 获取单个歌曲

**请求**

```
GET /api/songs/:id
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "歌曲名称",
    "artist": "艺术家",
    "album": "专辑",
    "duration": 240,
    "file_path": "1234567890.mp3",
    "file_name": "原始文件名.mp3",
    "lyrics": "歌词内容",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

### 3. 上传歌曲

**请求**

```
POST /api/songs/upload
Content-Type: multipart/form-data
```

**表单参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 音频文件 (mp3, wav, flac, m4a, ogg) |
| title | string | 否 | 歌曲名称（留空则从文件名提取） |
| artist | string | 否 | 艺术家（留空则从元数据提取） |
| album | string | 否 | 专辑名称 |
| lyrics | string | 否 | 歌词 |

**响应示例**

```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "id": 1,
    "title": "歌曲名称",
    "artist": "艺术家",
    "album": "专辑",
    "duration": 240,
    "file_path": "1234567890.mp3",
    "file_name": "原始文件名.mp3",
    "lyrics": "",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

### 4. 更新歌曲信息

**请求**

```
PUT /api/songs/:id
```

**请求体**

```json
{
  "title": "新歌曲名称",
  "artist": "新艺术家",
  "album": "新专辑",
  "lyrics": "新歌词"
}
```

**响应示例**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 1,
    "title": "新歌曲名称",
    "artist": "新艺术家",
    "album": "新专辑",
    "duration": 240,
    "file_path": "1234567890.mp3",
    "file_name": "原始文件名.mp3",
    "lyrics": "新歌词",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:30:00"
  }
}
```

### 5. 删除歌曲

**请求**

```
DELETE /api/songs/:id
```

**响应示例**

```json
{
  "success": true,
  "message": "删除成功"
}
```

## 歌单管理 API

### 1. 获取歌单列表

**请求**

```
GET /api/playlists
```

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "我的歌单",
      "description": "歌单描述",
      "song_count": 10,
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ]
}
```

### 2. 获取歌单详情

**请求**

```
GET /api/playlists/:id
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "我的歌单",
    "description": "歌单描述",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00",
    "songs": [
      {
        "id": 1,
        "title": "歌曲名称",
        "artist": "艺术家",
        "album": "专辑",
        "duration": 240,
        "file_path": "1234567890.mp3",
        "file_name": "原始文件名.mp3",
        "lyrics": "歌词",
        "sort_order": 0,
        "created_at": "2024-01-01 12:00:00",
        "updated_at": "2024-01-01 12:00:00"
      }
    ]
  }
}
```

### 3. 创建歌单

**请求**

```
POST /api/playlists
```

**请求体**

```json
{
  "name": "新歌单",
  "description": "歌单描述"
}
```

**响应示例**

```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "新歌单",
    "description": "歌单描述",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

### 4. 更新歌单信息

**请求**

```
PUT /api/playlists/:id
```

**请求体**

```json
{
  "name": "更新的歌单名",
  "description": "更新的描述"
}
```

**响应示例**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "更新的歌单名",
    "description": "更新的描述",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:30:00"
  }
}
```

### 5. 删除歌单

**请求**

```
DELETE /api/playlists/:id
```

**响应示例**

```json
{
  "success": true,
  "message": "删除成功"
}
```

### 6. 添加歌曲到歌单

**请求**

```
POST /api/playlists/:id/songs
```

**请求体**

```json
{
  "songIds": [1, 2, 3]
}
```

**响应示例**

```json
{
  "success": true,
  "message": "成功添加 3 首歌曲到歌单"
}
```

### 7. 从歌单移除歌曲

**请求**

```
DELETE /api/playlists/:id/songs/:songId
```

**响应示例**

```json
{
  "success": true,
  "message": "移除成功"
}
```

### 8. 更新歌单中歌曲排序

**请求**

```
PUT /api/playlists/:id/songs/reorder
```

**请求体**

```json
{
  "songOrders": [
    { "songId": 1, "sortOrder": 0 },
    { "songId": 2, "sortOrder": 1 },
    { "songId": 3, "sortOrder": 2 }
  ]
}
```

**响应示例**

```json
{
  "success": true,
  "message": "排序更新成功"
}
```

## 静态文件访问

### 音频文件

**请求**

```
GET /uploads/:filename
```

**示例**

```
GET /uploads/1234567890.mp3
```

音频文件直接通过文件路径访问，支持流式传输和断点续传。

## 错误响应

当请求失败时，API 返回如下格式：

```json
{
  "success": false,
  "message": "错误信息描述"
}
```

常见 HTTP 状态码：

- `200` - 成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

