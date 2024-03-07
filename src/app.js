import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view';
import resources from './locales/index.js';
import { rssParser, getFeed, getPosts } from './rssParser.js';

const routes = {
  path: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
};

const fetchData = (url) => axios.get(`${routes.path()}${encodeURIComponent(url)}`).then((res) => res);
const getValidUrls = (feeds) => feeds.map(({ link }) => link);
const addIdToPosts = (posts) => posts.map((post) => ({ id: _.uniqueId(), ...post }));

yup.setLocale({
  mixed: {
    notOneOf: () => 'errors.validation.exists',
  },
  string: {
    url: () => 'errors.validation.invalid',
  },
});

const validate = (fields, urls) => {
  const schema = yup.object({
    url: yup.string().url().notOneOf(urls),
  });
  return schema.validate(fields, { abortEarly: false });
};

const load = (watchedState) => {
  const { feeds, posts } = watchedState;
  const feedUrlPromises = Promise.allSettled(
    feeds.map(({ link }) => fetchData(link)),
  );

  feedUrlPromises
    .then((responses) => {
      responses
        .filter(({ status }) => status === 'fulfilled')
        .forEach(({ value }) => {
          const { url } = value.data.status;
          const currentFeed = feeds.find((feed) => feed.link === url);
          const content = rssParser(value.data.contents);
          const currentPosts = getPosts(content, currentFeed.id);

          const newPosts = _.differenceBy(currentPosts, posts, 'link');
          if (newPosts.length > 0) {
            const newPostsWithId = addIdToPosts(newPosts);
            watchedState.posts = [...newPostsWithId, ...posts];
          }
        });
    })
    .finally(() => {
      watchedState.timerId = setTimeout(() => load(watchedState), 5000);
    });
};

const loadNewPosts = (watchedState) => {
  if (watchedState.timerId) {
    clearTimeout(watchedState.timerId);
  }

  setTimeout(() => load(watchedState), 5000);
};

const initialRss = (content, watchedState) => {
  const domTree = rssParser(content);
  if (domTree.querySelector('parsererror')) {
    throw new Error('errors.parser.invalid');
  }
  watchedState.errKey = '';

  const initialFeed = getFeed(domTree, watchedState.form.fields.url);
  const initialPosts = addIdToPosts(getPosts(domTree, initialFeed.id));

  watchedState.feeds.push(initialFeed);
  watchedState.posts = [...initialPosts, ...watchedState.posts];
  watchedState.form.processState = 'finished';

  loadNewPosts(watchedState);
};

const errorsController = (err, watchedState) => {
  const errMessage = err.message;
  if (err.isAxiosError) {
    watchedState.errKey = 'errors.network.networkErr';
    return;
  }

  watchedState.errKey = errMessage;
};

const onClickController = ({ target }, watchedState) => {
  const targetId = target.id;
  if (targetId !== 'viweBtn' && targetId !== 'viweLink') return;

  const targetDatasetId = target.dataset.id;
  const selectedPost = watchedState.posts.find((p) => p.id === targetDatasetId);
  if (!watchedState.uiState.viewedPosts.includes(selectedPost.id)) {
    watchedState.uiState.viewedPosts.push(selectedPost.id);
  }
  watchedState.uiState.selectedPost = selectedPost;
};

const submitController = (event, watchedState) => {
  event.preventDefault();
  const dataForm = new FormData(event.target);
  const inputValue = dataForm.get('url').trim();
  watchedState.form.fields.url = inputValue;
  watchedState.form.processState = 'sending';
  const urls = getValidUrls(watchedState.feeds);
  validate(watchedState.form.fields, urls)
    .then(() => fetchData(inputValue))
    .then((res) => initialRss(res.data.contents, watchedState))
    .catch((err) => {
      watchedState.form.processState = 'failed';
      errorsController(err, watchedState);
    });
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    btn: document.querySelector('#rss-btn'),
    urlInput: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalLink: document.querySelector('#modal-link'),
  };

  const defaultLang = 'ru';

  const initialState = {
    form: {
      fields: {
        url: '',
      },
      processState: 'filling',
    },
    feeds: [],
    posts: [],
    errKey: null,
    timerId: null,
    uiState: {
      selectedPost: null,
      viewedPosts: [],
    },
  };

  const i18n = i18next.createInstance();
  const initi18n = i18n
    .init({
      lng: defaultLang,
      debug: true,
      resources,
    })
    .then((t) => t);

  const watchedState = watch(elements, initialState, initi18n);

  elements.form.addEventListener('submit', (event) => {
    submitController(event, watchedState);
  });

  elements.postsContainer.addEventListener('click', (event) => {
    onClickController(event, watchedState);
  });
};

export default app;
