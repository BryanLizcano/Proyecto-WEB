const orderService = require('../services/orderService');
const { sendSuccess } = require('../utils/apiResponse');

async function createOrder(req, res, next) {
  try {
    const newOrder = await orderService.createOrder(req.body);
    return sendSuccess(res, newOrder, 201);
  } catch (error) {
    return next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const { orders, meta } = await orderService.getOrders(req.query);
    return sendSuccess(res, orders, 200, meta);
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return sendSuccess(res, order, 200);
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, req.body.estado);
    return sendSuccess(res, updatedOrder, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
