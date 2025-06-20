const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '../data/games.json');
// JSONファイルの読み込み
const readGames = async () => {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

// JSONファイルへの保存
const writeGames = async (data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};
// 全件取得
router.get('/', async (req, res) => {
  const games = await readGames();
  res.json(games);
});
// 単一ゲーム取得
router.get('/:id', async (req, res) => {
  const games = await readGames();
  const game = games.find(g => g.id === Number(req.params.id));
  if (game) res.json(game);
  else res.status(404).send('Not found');
});
// 新規追加（Create）＋バリデーション
router.post('/', async (req, res) => {
  const { name, rank, point } = req.body;
  if (!name || !rank || !point) {
    return res.status(400).json({ error: 'name, rank, point are required' });
  }
  const games = await readGames();
  const newGame = {
    id: Date.now(),
    name,
    rank,
    point
  };
  games.push(newGame);
  await writeGames(games);
  res.status(201).json(newGame);
});
// 更新（Update）＋バリデーション
router.put('/:id', async (req, res) => {
  const games = await readGames();
  const index = games.findIndex(g => g.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const { name, rank, point } = req.body;
  if (!name && !rank && !point) {
    return res.status(400).json({ error: 'At least one field (name, rank, point) is required' });
  }

  games[index] = { ...games[index], ...req.body };
  await writeGames(games);
  res.json(games[index]);
});

// 更新（Update）＋バリデーション
router.delete('/:id', async (req, res) => {
  const games = await readGames();
  const index = games.findIndex(g => g.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const deleted = games.splice(index, 1);
  await writeGames(games);
  res.json(deleted[0]);
});

module.exports = router;
