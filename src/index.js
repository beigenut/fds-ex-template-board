import axios from 'axios';

// token instance 활용하기 -> axio. 선언하는 것 모두 postAPI 로 변경!
const postAPI = axios.create({})
const rootEl = document.querySelector('.root')
// 새로고침하면 로그인이 풀리는 현상 해결
if (localStorage.getItem('token')) {
  postAPI.defaults.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`
  // BEM; -- modifier
  rootEl.classList.add('root--authed')
} 

// 자주 쓰는 엘리먼트 빼주기 ex) templates.postList 
const templates = {   
  postList: document.querySelector('#post-list').content,
  postItem: document.querySelector('#post-item').content,
  postContent: document.querySelector('#post-content').content,
  login: document.querySelector('#login').content,
  newPost: document.querySelector('#post-form').content,
}

// Avoid code duplication
function render(fragment) {
  rootEl.textContent = '' // root 에 넣어줄 때마다 아무것도 없는 컨텐츠로 새로 그린다 
  rootEl.appendChild(fragment)
}

// 인덱스 페이지 탬플릿 실행기 
async function indexPage() {
  const res = await postAPI.get('http://localhost:3000/posts');
  // listFragment 에는 모든 postList(post-list) 의 엘리먼트들이 들어있음
  const listFragment = document.importNode(templates.postList, true);
  // log in 버튼에 add event 
  listFragment.querySelector('.btn__users-login').addEventListener("click", e => { loginPage() })
  // log out 버튼에 add event 
  listFragment.querySelector('.btn__users-logout').addEventListener("click", e => {
    localStorage.removeItem('token')
    // 객체의 속성을 지울 때는 delete
    delete postAPI.defaults.headers['Authorization']
    rootEl.classList.remove('root--authed')
    indexPage() 
  })
  // add new post 버튼에 add event
  listFragment.querySelector('.btn__new-post').addEventListener("click", e => { postFormPage() })

  res.data.forEach(post => {
    // post 에는 id, title, body, userId 가 있음
    const fragment = document.importNode(templates.postItem, true);
    const pEl = fragment.querySelector('.post-item__title');
    pEl.addEventListener("click", e => {
      postContentPage(post.id);
    })
    pEl.textContent = post.title;
    listFragment.querySelector('.post-list').appendChild(fragment);
  })
  render(listFragment)
}

// 게시글 페이지 실행기
async function postContentPage(postId) {
  const res = await postAPI.get(`http://localhost:3000/posts/${postId}`)
  const fragment = document.importNode(templates.postContent, true)
  fragment.querySelector('.post-content__title').textContent = res.data.title
  fragment.querySelector('.post-content__body').textContent = res.data.body
  fragment.querySelector('.btn__go-back').addEventListener("click", e => { indexPage() })

  render(fragment)
}

// 로그인 페이지 실행기
async function loginPage() {
  const fragment = document.importNode(templates.login, true)
  const formEl = fragment.querySelector('.login__form')
  formEl.addEventListener("submit", async e => {
    // payload : 통신에 보내는 값 
    const payload = {
      // e.target : formEl 이벤트가 일어나는 엘리먼트 
      // .elements : 그 엘리먼트 안에 속에있는 모든 엘리먼트들 
      // .username : name 이 해당 엘리먼트의 이름인 것
      // .value : input 안에 들어있는 값 (넘버, 스트링 등등) 
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    }
    // 실제로 데이터가 어딘가로 전송되는 것을 막기 위해서 
    e.preventDefault();
    const res = await postAPI.post('http://localhost:3000/users/login', payload)
    // alert(JSON.stringfy(payload)) 객체를 json 문서처럼 보일 수 있도록
    localStorage.setItem('token', res.data.token)
    // postAPI.defaults : 항상 기본으로 동작
    postAPI.defaults.headers['Authorization'] = `Bearer ${res.data.token}`;
    rootEl.classList.add('root--authed')
    // login 성공 후 페이지 이동
    indexPage()
  })
  render(fragment)
}

// 새 포스트 쓰기 생성
async function postFormPage() {
  const fragment = document.importNode(templates.newPost, true)
  const formEl = fragment.querySelector('.post-form')
  fragment.querySelector('.btn__go-back').addEventListener("click", e => { indexPage() })
  formEl.addEventListener("submit", async e => {
    const payload = {
      title: e.target.elements.title.value,
      body: e.target.elements.body.value
    }
    e.preventDefault()
    const res = await postAPI.post('http://localhost:3000/posts', payload)
    localStorage.setItem('token', res.data.token)
    postAPI.defaults.headers['Authorization'] = `Bearer ${res.data.token}`;
    rootEl.classList.add('root--authed')
    indexPage();
  })
  render(fragment)
}

indexPage();
// postContentPage(1);

