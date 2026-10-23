const { Router } = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const healthRoutes = require('./healthRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/categorias', categoryRoutes);
router.use('/productos', productRoutes);
router.use(healthRoutes);

module.exports = router;
