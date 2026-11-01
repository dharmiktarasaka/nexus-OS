const Task = require('../models/Task');
const Activity = require('../models/Activity');

const getTaskOwnerQuery = (req) => {
  const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
  return {
    $or: [
      { ownerId: ownerId },
      { createdBy: ownerId },
      { assignedTo: ownerId }
    ]
  };
};

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const query = {
      ...getTaskOwnerQuery(req)
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('leadId', 'name companyName phone')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, leadId, assignedTo, priority, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title and Due Date are required' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    const task = await Task.create({
      title,
      description: description || '',
      leadId: leadId || null,
      ownerId: ownerId,
      assignedTo: assignedTo || ownerId,
      priority: priority || 'MEDIUM',
      dueDate: new Date(dueDate),
      createdBy: ownerId
    });

    if (leadId) {
      await Activity.create({
        leadId,
        userId: ownerId,
        type: 'NOTE',
        description: `Task created: "${title}" (Due: ${new Date(dueDate).toLocaleDateString()})`
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('leadId', 'name companyName phone')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status / details
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ...getTaskOwnerQuery(req)
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    const updates = { ...req.body };
    delete updates.ownerId;
    delete updates.createdBy;

    Object.assign(task, updates);
    await task.save();

    if (task.leadId && req.body.status === 'COMPLETED') {
      const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
      await Activity.create({
        leadId: task.leadId,
        userId: ownerId,
        type: 'NOTE',
        description: `Task completed: "${task.title}" by ${req.user.name}`
      });
    }

    const updatedTask = await Task.findById(task._id)
      .populate('leadId', 'name companyName phone')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ...getTaskOwnerQuery(req)
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
