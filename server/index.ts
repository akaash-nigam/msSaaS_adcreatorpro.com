import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key'
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AdCreatorPro' });
});

// Generate ad copy
app.post('/api/generate-ad', async (req, res) => {
  try {
    const { product, platform, tone, targetAudience } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Product description is required' });
    }

    // Create a prompt for ad generation
    const prompt = `Create a compelling ${platform || 'social media'} advertisement for the following product/service:

Product: ${product}
Platform: ${platform || 'General'}
Tone: ${tone || 'Professional'}
Target Audience: ${targetAudience || 'General audience'}

Generate:
1. A catchy headline (max 60 characters)
2. Primary ad copy (max 150 characters)
3. Call-to-action text
4. 3 relevant hashtags

Format the response as JSON with keys: headline, copy, cta, hashtags`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert advertising copywriter. Create compelling, engaging ad content that drives conversions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse as JSON, fallback to structured text
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const adContent = JSON.parse(jsonMatch[0]);
        return res.json(adContent);
      }
    } catch (parseError) {
      // Fallback: parse the text response
      const lines = response.split('\n').filter(l => l.trim());
      const adContent = {
        headline: lines.find(l => l.includes('headline'))?.split(':')[1]?.trim() || lines[0],
        copy: lines.find(l => l.toLowerCase().includes('copy'))?.split(':')[1]?.trim() || lines[1],
        cta: lines.find(l => l.toLowerCase().includes('cta') || l.toLowerCase().includes('call'))?.split(':')[1]?.trim() || 'Learn More',
        hashtags: lines.filter(l => l.includes('#')).map(l => l.trim())
      };
      return res.json(adContent);
    }

  } catch (error: any) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      error: 'Failed to generate ad',
      message: error.message
    });
  }
});

// Ad templates
app.get('/api/templates', (_req, res) => {
  const templates = [
    {
      id: 1,
      name: 'Social Media Post',
      platform: 'Facebook/Instagram',
      dimensions: '1080x1080',
      description: 'Square format perfect for social feeds'
    },
    {
      id: 2,
      name: 'Instagram Story',
      platform: 'Instagram',
      dimensions: '1080x1920',
      description: 'Vertical format for Instagram stories'
    },
    {
      id: 3,
      name: 'Facebook Ad',
      platform: 'Facebook',
      dimensions: '1200x628',
      description: 'Optimized for Facebook news feed'
    },
    {
      id: 4,
      name: 'Google Display Ad',
      platform: 'Google Ads',
      dimensions: '728x90',
      description: 'Leaderboard banner format'
    },
    {
      id: 5,
      name: 'LinkedIn Post',
      platform: 'LinkedIn',
      dimensions: '1200x627',
      description: 'Professional network format'
    },
    {
      id: 6,
      name: 'Twitter Card',
      platform: 'Twitter/X',
      dimensions: '1200x675',
      description: 'Optimized for Twitter cards'
    }
  ];

  res.json(templates);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`🚀 AdCreatorPro server running on port ${port}`);
  console.log(`📝 API endpoint: http://localhost:${port}/api`);
});
