const express = require('express');
const Kit = require('../models/Kit');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { runPipeline } = require('../services/pipeline');

const router = express.Router();

// Protect all /api/kits routes
router.use(protect);

/**
 * POST /api/kits/generate
 * Calls services/pipeline.js runPipeline(), then saves the resulting Kit scoped to req.user.id.
 */
router.post('/generate', validateBody(['jd']), async (req, res, next) => {
  try {
    const { jd, company_url, days } = req.body;

    const pipelineResult = await runPipeline({
      jd,
      company_url,
      days: days || 7,
    });

    if (pipelineResult.status === 'failed') {
      return res.status(400).json({
        error: pipelineResult.error || {
          code: 'GENERATION_FAILED',
          message: 'Pipeline execution failed.',
        },
      });
    }

    // Persist to database with tenant owner user_id
    const kitData = {
      ...pipelineResult.kit,
      user_id: req.user.id,
    };

    const savedKit = await Kit.create(kitData);

    return res.status(201).json({
      message: 'Kit generated successfully',
      kit: savedKit,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/kits
 * Lists all kits owned by req.user.id (strict tenant scoping)
 */
router.get('/', async (req, res, next) => {
  try {
    const kits = await Kit.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ kits });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/kits/:id
 * Fetches a specific kit by ID for req.user.id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!kit) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Kit not found or access denied.',
        },
      });
    }
    return res.status(200).json({ kit });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/kits/:id/status
 * Returns generation status for polling
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.id, user_id: req.user.id }).select('status error');
    if (!kit) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Kit not found or access denied.',
        },
      });
    }
    return res.status(200).json({ status: kit.status, error: kit.error });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/kits/:id
 * Updates a specific kit for req.user.id (e.g. user toggles edited or pinned flags)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updatedKit = await Kit.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedKit) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Kit not found or access denied.',
        },
      });
    }

    return res.status(200).json({ kit: updatedKit });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/kits/:id
 * Deletes a kit owned by req.user.id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deletedKit = await Kit.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!deletedKit) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Kit not found or access denied.',
        },
      });
    }

    return res.status(200).json({ message: 'Kit deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
