const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '../data/dramas.json');
// JSONファイルの読み込み
const readDramas = async () => {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

// JSONファイルへの保存
const writeDramas = async (data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// 全件取得
router.get('/', async (req, res) => {
  const dramas = await readDramas();
  res.json(dramas);
});
// 単一ドラマ取得
router.get('/:id', async (req, res) => {
  const dramas = await readDramas();
  const drama = dramas.find(d => d.id === Number(req.params.id));
  if (drama) res.json(drama);
  else res.status(404).send('Not found');
});
// 新規追加（Create）＋バリデーション
router.post('/', async (req, res) => {
  const { title, progress, total } = req.body;
  if (!title || typeof progress !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'title, progress (number), total (number) are required' });
  }
  const dramas = await readDramas();
  const newDrama = {
    id: Date.now(),
    title,
    progress,
    total
  };
  dramas.push(newDrama);
  await writeDramas(dramas);
  res.status(201).json(newDrama);
});

// 更新（Update）＋バリデーション
router.put('/:id', async (req, res) => {
  const dramas = await readDramas();
  const index = dramas.findIndex(d => d.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const { title, progress, total } = req.body;
  if (!title && typeof progress !== 'number' && typeof total !== 'number') {
    return res.status(400).json({ error: 'At least one of title, progress (number), or total (number) is required' });
  }

  dramas[index] = { ...dramas[index], ...req.body };
  await writeDramas(dramas);
  res.json(dramas[index]);
});

// 削除（Delete）
router.delete('/:id', async (req, res) => {
  const dramas = await readDramas();
  const index = dramas.findIndex(d => d.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const deleted = dramas.splice(index, 1);
  await writeDramas(dramas);
  res.json(deleted[0]);
});

module.exports = router;
