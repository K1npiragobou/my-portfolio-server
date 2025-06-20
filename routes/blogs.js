const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '../data/blogs.json');

// JSONファイルの読み込み
const readBlogs = async () => {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

// JSONファイルへの保存
const writeBlogs = async (data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// 全件取得
router.get('/', async (req, res) => {
  const blogs = await readBlogs();
  res.json(blogs);
});

// 単一記事取得
router.get('/:id', async (req, res) => {
  const blogs = await readBlogs();
  const blog = blogs.find(b => b.id === Number(req.params.id));
  if (blog) res.json(blog);
  else res.status(404).send('Not found');
});

// 新規追加（Create）＋バリデーション
router.post('/', async (req, res) => {
  const { title, date, content } = req.body;
  if (!title || !date || !content) {
    return res.status(400).json({ error: 'title, date, content are required' });
  }
  const blogs = await readBlogs();
  const newBlog = {
    id: Date.now(),
    title,
    date,
    content
  };
  blogs.push(newBlog);
  await writeBlogs(blogs);
  res.status(201).json(newBlog);
});

// 更新（Update）＋バリデーション
router.put('/:id', async (req, res) => {
  const blogs = await readBlogs();
  const index = blogs.findIndex(b => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const { title, date, content } = req.body;
  if (!title && !date && !content) {
    return res.status(400).json({ error: 'At least one field (title, date, content) is required' });
  }

  blogs[index] = { ...blogs[index], ...req.body };
  await writeBlogs(blogs);
  res.json(blogs[index]);
});

// 削除（Delete）
router.delete('/:id', async (req, res) => {
  const blogs = await readBlogs();
  const index = blogs.findIndex(b => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).send('Not found');

  const deleted = blogs.splice(index, 1);
  await writeBlogs(blogs);
  res.json(deleted[0]);
});
// スプレッドシート等から全データを一括セット
router.post('/set-all', async (req, res) => {
  const blogs = req.body;
  if (!Array.isArray(blogs)) {
    return res.status(400).json({ error: 'Array of blogs is required' });
  }
  for (const blog of blogs) {
    if (!blog.title || !blog.date || !blog.content) {
      return res.status(400).json({ error: 'Each blog must have title, date, content' });
    }
  }
  // idを自動付与したい場合はここで付与も可能
  await writeBlogs(blogs);
  res.json({ message: 'Blogs data replaced', count: blogs.length });
});

module.exports = router;
