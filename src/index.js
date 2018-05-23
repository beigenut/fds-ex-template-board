import axios from 'axios';

// 자주 쓰는 엘리먼트 빼주기 ex) templates.postList 
const rootEl = document.querySelector('.root')
const templates = {   
  postList: document.querySelector('#post-list').content,
  postItem: document.querySelector('#post-item').content,
}

// 인덱스 페이지 탬플릿 실행기 
async function indexPage() {
  const res = await axios.get('http://localhost:3000/posts');
  const listFragment = document.importNode(templates.postList, true);

  res.data.forEach(post => {
    const fragment = document.importNode(templates.postItem, true);
    const pEl = fragment.querySelector('.post-item__title');
    pEl.textContent = post.title;
    listFragment.querySelector('.post-list').appendChild(fragment);
  })

  rootEl.appendChild(listFragment);
}

indexPage();

// 썸띵썸띵