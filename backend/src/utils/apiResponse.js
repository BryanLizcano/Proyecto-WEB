function sendSuccess(res, data, status = 200, meta = null) {
  const payload = {
    status: 'success',
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

module.exports = {
  sendSuccess,
};
