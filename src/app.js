/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view';
import resources from './locales/index.js';
import { rssParser, getFedd, getPosts } from './rssParser.js';

const routes = {
  path: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
};

const fetchData = (url) => axios.get(`${routes.path()}${encodeURIComponent(url)}`);
const getValidUrls = (feeds) => feeds.map(({ link }) => link);
const addFeedId = (feed) => ({ id: _.uniqueId(), ...feed });
const addPostsId = (posts) => posts.map((post) => ({ id: _.uniqueId(), ...post }));

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

const load = (timerId, watchedState, period) => {
  const { feeds, posts } = watchedState;
  const newPostsPromises = Promise.allSettled(
    feeds.map(({ id, link }) => fetchData(link).then((res) => {
      const content = rssParser(res.data.contents);
      const currentPosts = getPosts(content, id);
      return currentPosts;
    })),
  );

  newPostsPromises.then((res) => res
    .filter(({ status }) => status === 'fulfilled')
    .forEach(({ value }) => {
      const newPosts = _.differenceBy(value, posts, 'link');
      if (newPosts.length > 0) {
        const newPostsWithId = addPostsId(newPosts);
        watchedState.posts = [...newPostsWithId, ...posts];
      }
    }));

  timerId = setTimeout(() => load(timerId, watchedState, period), period);
  watchedState.timerId = timerId;
};

const loadNewPosts = (watchedState) => {
  if (watchedState.timerId) {
    clearTimeout(watchedState.timerId);
  }
  const period = 5000;
  const timerId = setTimeout(() => load(timerId, watchedState, period), period);
};

const initialRss = (content, watchedState) => {
  const domTree = rssParser(content);
  if (domTree.querySelector('parsererror')) {
    throw new Error('parsererror');
  }
  watchedState.errKey = '';

  const initialFeed = addFeedId(getFedd(domTree, watchedState.form.fields.url));
  const initialPosts = addPostsId(getPosts(domTree, initialFeed.id));

  watchedState.feeds.push(initialFeed);
  watchedState.posts = [...initialPosts, ...watchedState.posts];
  watchedState.form.processState = 'finished';

  loadNewPosts(watchedState);
};

const errorsController = (err, watchedState) => {
  const { currentCheck } = watchedState;
  switch (currentCheck) {
    case 'validation':
      watchedState.errKey = err.inner[0].message;
      break;
    default:
      watchedState.errKey = watchedState.mappingErrors[currentCheck];
      break;
  }
};

const submitController = (event, watchedState) => {
  event.preventDefault();
  const dataForm = new FormData(event.target);
  const inputValue = dataForm.get('url').trim();
  watchedState.form.fields.url = inputValue;
  watchedState.currentCheck = 'validation';
  watchedState.form.processState = 'sending';
  const urls = getValidUrls(watchedState.feeds);
  validate(watchedState.form.fields, urls)
    .then(() => {
      watchedState.currentCheck = 'network';
      return fetchData(inputValue);
    })
    .then((res) => {
      watchedState.currentCheck = 'parseRss';
      const content = res.data.contents;
      initialRss(content, watchedState);
    })
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
    currentCheck: null,
    mappingErrors: {
      network: 'errors.network.networkErr',
      parseRss: 'errors.parser.invalid',
    },
    errKey: null,
    timerId: null,
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
};

export default app;
