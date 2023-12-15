/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view';
import resources from './locales/index.js';

const routes = {
  path: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
};

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

const rssParserFeed = (content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');
  return doc;
};

const initialFeeds = (content, watchedState) => {
  const domTree = rssParserFeed(content);
  if (domTree.querySelector('parsererror')) {
    throw new Error('parsererror');
  }

  watchedState.urls.push(watchedState.form.fields.url);
  watchedState.errKey = '';

  const channel = domTree.querySelector('channel');
  const titleFedd = channel.querySelector('title');
  const descriptionFeed = channel.querySelector('description');
  const linkFeed = channel.querySelector('link');
  const posts = channel.querySelectorAll('item');

  const uniqueIdFedd = _.uniqueId();
  const initialFeed = {
    id: uniqueIdFedd,
    title: titleFedd.textContent,
    description: descriptionFeed.textContent,
    link: linkFeed.textContent,
  };

  const mappedPosts = Array.from(posts).map((post) => {
    const titlePost = post.querySelector('title');
    const linkPost = post.querySelector('link');
    const descriptionPost = post.querySelector('description');

    const initialPost = {
      id: _.uniqueId(),
      feedId: uniqueIdFedd,
      title: titlePost.textContent,
      description: descriptionPost.textContent,
      link: linkPost.textContent,
    };

    return initialPost;
  });

  watchedState.posts = [...mappedPosts, ...watchedState.posts];
  watchedState.feeds.push(initialFeed);
  watchedState.form.processState = 'finished';
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
  validate(watchedState.form.fields, watchedState.urls)
    .then(() => {
      watchedState.currentCheck = 'network';
      return axios.get(`${routes.path()}${encodeURIComponent(inputValue)}`);
    })
    .then((res) => {
      watchedState.currentCheck = 'parseRss';
      const content = res.data.contents;
      initialFeeds(content, watchedState);
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
    urls: [],
    feeds: [],
    posts: [],
    currentCheck: null,
    mappingErrors: {
      network: 'errors.network.networkErr',
      parseRss: 'errors.parser.invalid',
    },
    errKey: null,
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
