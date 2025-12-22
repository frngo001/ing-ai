NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Configuration (Deepseek via OpenAI-compatible API)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TRANSCRIPTION_ENABLED=false
DEEPSEEK_TRANSCRIPTION_PATH=/audio/transcriptions
DEEPSEEK_TRANSCRIPTION_MODEL=whisper-1
DEEPSEEK_TRANSCRIPTION_FIELD=file

# Optional: Rate limiting for /api/ai/command
AI_COMMAND_RATE_LIMIT_MAX=60
AI_COMMAND_RATE_LIMIT_WINDOW_MS=60000

# Optional: Cache configuration (if using Redis/Upstash)
# REDIS_URL=your_redis_url_here

# Optional: YouTube Data API v3 (für Video-Dauer)
# YOUTUBE_API_KEY=your_youtube_api_key_here
