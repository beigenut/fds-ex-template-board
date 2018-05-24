import axios from 'axios';

// token instance 활용하기 -> axio. 선언하는 것 모두 postAPI 로 변경!
const postAPI = axios.create({
  baseURL: process.env.API_URL
  // baseURL: 'http://localhost:3000'
})

const rootEl = document.querySelector('.root')

function login(token) {
  localStorage.setItem('token', token)
  // postAPI.defaults : 항상 기본으로 동작
  postAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  // BEM -- modifier
  rootEl.classList.add('root--authed')
}

function logout() {
  localStorage.removeItem('token')
  // 객체의 속성을 지울 때는 delete
  delete postAPI.defaults.headers['Authorization']
  rootEl.classList.remove('root--authed')
}

// 자주 쓰는 엘리먼트 빼주기 ex) templates.postList 
const templates = {   
  postList: document.querySelector('#post-list').content,
  postItem: document.querySelector('#post-item').content,
  postContent: document.querySelector('#post-content').content,
  login: document.querySelector('#login').content,
  newPost: document.querySelector('#post-form').content,
  comments: document.querySelector('#comments').content,
  commentItem: document.querySelector('#comment-item').content,
}

// Avoid code duplication
function render(fragment) {
  rootEl.textContent = '' // root 에 넣어줄 때마다 아무것도 없는 컨텐츠로 새로 그린다 
  rootEl.appendChild(fragment)
}

// 인덱스 페이지 (메인 페이지) 탬플릿 실행기 
async function indexPage() {
  // await 붙은 통신 부분이 시간을 잡아먹는 부분이므로, 통신 앞 뒤로 인디케이터를 띄운다
  rootEl.classList.add('root--loading')
  // 가급적 db, server 와 통신회수를 줄일 수록 좋다 ex. expand 를 쓴다
  // posts?_expand=user 를 쓸 수 있는 json 서버 명령어 
  // post 와 연결된 속성의 userId 물려있는 값까지 가지고 온다
  const res = await postAPI.get('/posts?_expand=user');
  rootEl.classList.remove('root--loading')
  
  // listFragment 에는 모든 postList(post-list) 의 엘리먼트들이 들어있음
  const listFragment = document.importNode(templates.postList, true);
  
  // log in 버튼에 add event 
  listFragment.querySelector('.btn__users-login').addEventListener("click", e => { loginPage() })
  
  // log out 버튼에 add event 
  listFragment.querySelector('.btn__users-logout').addEventListener("click", e => {
    logout()
    indexPage() 
  })
  
  // add new post 버튼에 add event
  listFragment.querySelector('.btn__new-post').addEventListener("click", e => { postFormPage() })

  res.data.forEach(post => {
    // post 에는 id, title, body, userId 가 있음
    const fragment = document.importNode(templates.postItem, true);
    fragment.querySelector('.post-item__author').textContent = post.user.username
    const pEl = fragment.querySelector('.post-item__title');
    pEl.addEventListener("click", e => {
      postContentPage(post.id);
    })
    pEl.textContent = post.title;
    listFragment.querySelector('.post-list').appendChild(fragment);
  })
  render(listFragment)
}

// 게시글 상세 페이지 실행기
async function postContentPage(postId) {
  const res = await postAPI.get(`/posts/${postId}`)
  const fragment = document.importNode(templates.postContent, true)
  fragment.querySelector('.post-content__title').textContent = res.data.title
  fragment.querySelector('.post-content__body').textContent = res.data.body
  fragment.querySelector('.btn__go-back').addEventListener("click", e => { 
    indexPage()
  })

  // 로컬 스토리지에 토큰이 저장되어 있는 상태라면 아래 댓글을 불러와 
  if (localStorage.getItem('token')) {
    const commentsFragment = document.importNode(templates.comments, true)
    const commentsRes = await postAPI.get(`/post/${postId}/comments`)
    commentsRes.data.forEach(comment => {
      const itemFragment = document.importNode(templates.commentItem, true)
      itemFragment.querySelector('.comment-item__body').textContent = comment.body
      commentsFragment.querySelector('.comments__list').appendChild(itemFragment)
    })
    const formEl = commentsFragment.querySelector('.comments__form')
    formEl.addEventListener('submit', async e => {
      e.preventDefault()
      const payload = {
        body: e.target.elements.body.value
      }
      const res = await postAPI.post(`/posts/${postId}/comments`, payload)
      // 제3자가 그 사이에 코멘트를 추가했을 경우 그것까지 불러온다 (최신 데이터까지) 
      // 페이지를 새로 로드해야하기 때문에 비효율적일 순 있다
      postContentPage(postId)
    })
    fragment.appendChild(commentsFragment)
  }
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
    const res = await postAPI.post('/users/login', payload)
    // alert(JSON.stringfy(payload)) 객체를 json 문서처럼 보일 수 있도록
    login(res.data.token)
    // login 성공 후 페이지 이동
    indexPage()
  })
  render(fragment)
}

// 새 포스트 쓰기 생성
async function postFormPage() {
  const fragment = document.importNode(templates.newPost, true)
  const formEl = fragment.querySelector('.post-form')
  fragment.querySelector('.btn__go-back').addEventListener("click", e => {
    e.preventDefault()
    indexPage() 
  })
  formEl.addEventListener("submit", async e => {
    e.preventDefault()
    const payload = {
      title: e.target.elements.title.value,
      body: e.target.elements.body.value
    }
    const res = await postAPI.post('/posts', payload)
    indexPage();
    // postContentPage(post.id) // post.id = res.data.id
  })
  render(fragment)
}

// 새로고침하면 로그인이 풀리는 현상 해결
if (localStorage.getItem('token')) {
  login(localStorage.getItem('token'))
} 

indexPage();
// postContentPage(1);

