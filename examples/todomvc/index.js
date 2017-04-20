import 'todomvc-app-css/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import configureStore from './store/configureStore';
import Root from './containers/Root';

const store = configureStore();

const rootEl = document.getElementById('root');
const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>,
    rootEl
  );
};

render(Root);
if (module.hot) {
  /* eslint-disable global-require */
  module.hot.accept('./containers/Root', () => render(require('./containers/Root').default));
}
