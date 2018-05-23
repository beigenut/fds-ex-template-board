import axios from 'axios';

axios.get('http://localhost:3000/posts').then(res => {
  res.data.forEach(post => {
    const fragment = document.importNode(document.querySelector('#post-item').content, true)
    const pEl = fragment.querySelector('.post-item__title')
    pEl.textContent = post.title
    document.querySelector('.post-list').appendChild(fragment)
  })
})