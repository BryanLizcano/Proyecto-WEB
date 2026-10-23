const { Router } = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const healthRoutes = require('./healthRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/categorias', categoryRoutes);
router.use('/productos', productRoutes);
router.use('/pedidos', orderRoutes);
router.use(healthRoutes);

module.exports = router;
