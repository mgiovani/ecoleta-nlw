import express from 'express';

const app = express();

app.get('/users', (request, response) => {
  response.json({ msg: 'Lista de usuários' });
});

app.listen(3333);
