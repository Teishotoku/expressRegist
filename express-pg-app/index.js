const express = require('express');
const { init } = require('./db');

const app = express();
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/posts', require('./routes/posts'));
app.use('/comments', require('./routes/comments'));

const PORT = process.env.PORT || 3000;

init().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
