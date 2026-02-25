require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // In production, change to your GitHub Pages URL e.g. 'https://yourusername.github.io'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ─── MongoDB Connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Case Schema & Model ───────────────────────────────────────────────────────
const caseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 0,
    max: 150
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  lat: {
    type: Number,
    default: null
  },
  lng: {
    type: Number,
    default: null
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms are required'],
    trim: true
  },
  waterSource: {
    type: String,
    enum: ['Well', 'River', 'Pond', 'Municipal', 'Borewell', 'Other'],
    required: [true, 'Water source is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Severity is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Recovered', 'Under Treatment'],
    default: 'Active'
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  synced: {
    type: Boolean,
    default: true
  },
  userId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Case = mongoose.model('Case', caseSchema);

// ─── Routes ────────────────────────────────────────────────────────────────────

// Health check - frontend calls this to see if backend is alive
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AISH Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// GET all cases - sorted by newest first
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await Case.find().sort({ timestamp: -1 });
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases', details: error.message });
  }
});

// GET single case by ID
app.get('/api/cases/:id', async (req, res) => {
  try {
    const foundCase = await Case.findById(req.params.id);
    if (!foundCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(foundCase);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'Failed to fetch case', details: error.message });
  }
});

// POST create a new case
app.post('/api/cases', async (req, res) => {
  try {
    const newCase = new Case({
      ...req.body,
      synced: true,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
    });

    const savedCase = await newCase.save();
    console.log(`✅ New case created: ${savedCase.name} from ${savedCase.location}`);
    res.status(201).json(savedCase);
  } catch (error) {
    console.error('Error creating case:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.message });
    }
    res.status(500).json({ error: 'Failed to create case', details: error.message });
  }
});

// POST sync bulk offline cases (when device comes back online)
app.post('/api/cases/sync', async (req, res) => {
  try {
    const { cases: casesToSync } = req.body;

    if (!casesToSync || !Array.isArray(casesToSync)) {
      return res.status(400).json({ error: 'Invalid sync payload. Expected { cases: [...] }' });
    }

    const savedCases = [];
    const errors = [];

    for (const caseData of casesToSync) {
      try {
        // Skip duplicates if already has a MongoDB _id
        if (caseData._id) {
          const existing = await Case.findById(caseData._id);
          if (existing) {
            savedCases.push(existing);
            continue;
          }
        }

        const newCase = new Case({
          ...caseData,
          synced: true,
          timestamp: caseData.timestamp ? new Date(caseData.timestamp) : new Date()
        });

        const saved = await newCase.save();
        savedCases.push(saved);
      } catch (err) {
        errors.push({ case: caseData.name, error: err.message });
      }
    }

    console.log(`✅ Synced ${savedCases.length} cases, ${errors.length} errors`);
    res.json({
      message: `Synced ${savedCases.length} cases successfully`,
      cases: savedCases,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error syncing cases:', error);
    res.status(500).json({ error: 'Failed to sync cases', details: error.message });
  }
});

// PUT update a case by ID
app.put('/api/cases/:id', async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    console.log(`✅ Case updated: ${updatedCase.name}`);
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.message });
    }
    res.status(500).json({ error: 'Failed to update case', details: error.message });
  }
});

// DELETE a case by ID
app.delete('/api/cases/:id', async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);

    if (!deletedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    console.log(`🗑️ Case deleted: ${deletedCase.name}`);
    res.json({ message: 'Case deleted successfully', deletedCase });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case', details: error.message });
  }
});

// GET basic stats (bonus endpoint)
app.get('/api/stats', async (req, res) => {
  try {
    const [total, active, recovered, critical] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'Active' }),
      Case.countDocuments({ status: 'Recovered' }),
      Case.countDocuments({ severity: 'high' })
    ]);

    res.json({ total, active, recovered, critical });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 AISH Backend running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
