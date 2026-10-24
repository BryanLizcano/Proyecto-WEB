const clienteService = require('../services/clienteService');
const { sendSuccess } = require('../utils/apiResponse');

async function getProfile(req, res, next) {
  try {
    return sendSuccess(res, req.cliente);
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await clienteService.updateProfile(req.cliente.id_cliente, req.body);
    return sendSuccess(res, profile);
  } catch (error) {
    return next(error);
  }
}

async function getCustomerOrders(req, res, next) {
  try {
    const orders = await clienteService.getCustomerOrders(req.cliente.id_cliente, req.cliente.email);
    return sendSuccess(res, orders);
  } catch (error) {
    return next(error);
  }
}

async function getCustomerOrderDetail(req, res, next) {
  try {
    const order = await clienteService.getCustomerOrderDetail(
      req.params.id,
      req.cliente.id_cliente,
      req.cliente.email
    );
    return sendSuccess(res, order);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getCustomerOrders,
  getCustomerOrderDetail,
};
