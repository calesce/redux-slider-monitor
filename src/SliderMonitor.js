import React, { PropTypes, Component } from 'react';
import { findDOMNode } from 'react-dom';
import * as themes from 'redux-devtools-themes';
import { ActionCreators } from 'redux-devtools';

import reducer from './reducers';
import Slider from './Slider';

const { reset, jumpToState } = ActionCreators;

export default class SliderMonitor extends Component {
  static update = reducer;

  constructor(props) {
    super(props);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyPress);
    }

    this.state = {
      timer: undefined,
      replaySpeed: '1x'
    };
  }

  static propTypes = {
    dispatch: PropTypes.func,
    computedStates: PropTypes.array,
    actionsById: PropTypes.object,
    currentStateIndex: PropTypes.number,
    monitorState: PropTypes.shape({
      initialScrollTop: PropTypes.number
    }),
    preserveScrollTop: PropTypes.bool,
    stagedActions: PropTypes.array,
    select: PropTypes.func.isRequired,
    theme: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string
    ])
  };

  static defaultProps = {
    select: (state) => state,
    theme: 'nicinabox',
    preserveScrollTop: true
  };

  componentWillReceiveProps(nextProps) {
    const node = findDOMNode(this);
    if (!node) {
      this.scrollDown = true;
    } else if (
      this.props.stagedActionIds.length < nextProps.stagedActionIds.length
    ) {
      const { scrollTop, offsetHeight, scrollHeight } = node;

      this.scrollDown = Math.abs(
        scrollHeight - (scrollTop + offsetHeight)
      ) < 20;
    } else {
      this.scrollDown = false;
    }
  }

  componentDidUpdate() {
    const node = findDOMNode(this);
    if (!node) {
      return;
    }
    if (this.scrollDown) {
      const { offsetHeight, scrollHeight } = node;
      node.scrollTop = scrollHeight - offsetHeight;
      this.scrollDown = false;
    }
  }

  handleReset = () => {
    this.props.dispatch(reset());
  }

  handleKeyPress = (event) => {
    if (event.ctrlKey && event.keyCode === 74) { // ctrl+j
      event.preventDefault();

      if (this.state.timer) {
        return this.pauseReplay();
      }

      if (this.state.replaySpeed === 'Live') {
        this.startRealtimeReplay();
      } else {
        this.startReplay();
      }
    } else if (event.ctrlKey && event.keyCode === 219) { // ctrl+[
      event.preventDefault();
      this.stepLeft();
    } else if (event.ctrlKey && event.keyCode === 221) { // ctrl+]
      event.preventDefault();
      this.stepRight();
    }
  }

  handleSliderChange = (value) => {
    if (this.state.timer) {
      this.pauseReplay();
    }

    this.props.dispatch(jumpToState(value));
  }

  startReplay = () => {
    const { computedStates, currentStateIndex, dispatch } = this.props;

    if (computedStates.length < 2) {
      return;
    }
    let speed = this.state.replaySpeed === '1x' ? 500 : 200;

    let stateIndex;
    if (currentStateIndex === computedStates.length - 1) {
      dispatch(jumpToState(0));
      stateIndex = 0;
    } else if (currentStateIndex === computedStates.length - 2) {
      dispatch(jumpToState(currentStateIndex + 1));
      return;
    } else {
      stateIndex = currentStateIndex + 1;
      dispatch(jumpToState(currentStateIndex + 1));
    }

    let counter = stateIndex;
    let timer = setInterval(() => {
      if (counter + 1 <= computedStates.length - 1) {
        dispatch(jumpToState(counter + 1));
      }
      counter++;

      if (counter >= computedStates.length - 1) {
        clearInterval(this.state.timer);
        return this.setState({
          timer: undefined
        });
      }
    }, speed);

    this.setState({ timer });
  }

  startRealtimeReplay = () => {
    if (this.props.computedStates.length < 2) {
      return;
    }

    if (this.props.currentStateIndex === this.props.computedStates.length - 1) {
      this.props.dispatch(jumpToState(0));

      this.loop(0);
    } else {
      this.loop(this.props.currentStateIndex);
    }
  }

  loop = (index) => {
    let currentTimestamp = Date.now();
    let timestampDiff = this.getLatestTimestampDiff(index);

    let aLoop = () => {
      let replayDiff = Date.now() - currentTimestamp;
      if (replayDiff >= timestampDiff) {
        this.props.dispatch(jumpToState(this.props.currentStateIndex + 1));

        if (this.props.currentStateIndex >= this.props.computedStates.length - 1) {
          return this.pauseReplay();
        }

        timestampDiff = this.getLatestTimestampDiff(this.props.currentStateIndex);
        currentTimestamp = Date.now();

        this.setState({
          timer: requestAnimationFrame(aLoop)
        });
      } else {
        this.setState({
          timer: requestAnimationFrame(aLoop)
        });
      }
    };

    if (index !== this.props.computedStates.length - 1) {
      this.setState({
        timer: requestAnimationFrame(aLoop)
      });
    }
  }

  getLatestTimestampDiff = (index) => {
    return this.getTimestampOfStateIndex(index + 1) - this.getTimestampOfStateIndex(index);
  }

  getTimestampOfStateIndex = (stateIndex) => {
    let id = this.props.stagedActionIds[stateIndex];

    return this.props.actionsById[id].timestamp;
  }

  pauseReplay = (cb) => {
    if (this.state.timer) {
      cancelAnimationFrame(this.state.timer);
      clearInterval(this.state.timer);
      this.setState({
        timer: undefined
      }, () => {
        if (typeof cb === 'function') {
          cb();
        }
      });
    }
  }

  stepLeft = () => {
    this.pauseReplay();

    if (this.props.currentStateIndex !== 0) {
      this.props.dispatch(jumpToState(this.props.currentStateIndex - 1));
    }
  }

  stepRight = () => {
    this.pauseReplay();

    if (this.props.currentStateIndex !== this.props.computedStates.length - 1) {
      this.props.dispatch(jumpToState(this.props.currentStateIndex + 1));
    }
  }

  changeReplaySpeed = () => {
    let replaySpeed;
    switch (this.state.replaySpeed) {
    case '1x':
      replaySpeed = '2x';
      break;
    case '2x':
      replaySpeed = 'Live';
      break;
    default:
      replaySpeed = '1x';
    }

    this.setState({ replaySpeed });

    if (this.state.timer) {
      this.pauseReplay(() => {
        if (replaySpeed === 'Live') {
          this.startRealtimeReplay();
        } else {
          this.startReplay();
        }
      });
    }
  }

  containerStyle = (theme) => {
    return {
      fontFamily: 'monospace',
      position: 'relative',
      padding: '1.1rem',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: theme.base00,
      WebkitUserSelect: 'none', MozUserSelect: 'none', MsUserSelect: 'none'
    };
  }

  iconStyle(theme) {
    return {
      cursor: 'hand',
      fill: theme.base06,
      width: '2.3rem',
      height: '2.3rem'
    };
  }

  renderPlayButton(theme) {
    let play = this.state.replaySpeed === 'Live' ? this.startRealtimeReplay : this.startReplay;

    return (
      <a onClick={play} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle(theme)}
        >
          <g><path d='M8 5v14l11-7z'></path></g>
        </svg>
      </a>
    );
  }

  renderPauseButton = (theme) => {
    return (
      <a onClick={this.pauseReplay} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle(theme)}
        >
          <g><path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'></path></g>
        </svg>
      </a>
    );
  }

  renderStepLeftButton = (theme) => {
    return (
      <a onClick={this.stepLeft} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle(theme)}
        >
          <g><path d='M15.41 16.09l-4.58-4.59 4.58-4.59-1.41-1.41-6 6 6 6z'></path></g>
        </svg>
      </a>
    );
  }

  renderStepRightButton = (theme) => {
    return (
      <a onClick={this.stepRight} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle(theme)}
        >
          <g><path d='M8.59 16.34l4.58-4.59-4.58-4.59 1.41-1.41 6 6-6 6z'></path></g>
        </svg>
      </a>
    );
  }

  renderPlaybackSpeedButton = (theme) => {
    let style = {
      cursor: 'hand',
      color: theme.base06,
      fontSize: this.state.replaySpeed === 'Live' ? '1.1em' : '1.8em',
      paddingBottom: 50
    };

    return (
      <div style={style} onClick={this.changeReplaySpeed}>
        { this.state.replaySpeed }
      </div>
    );
  }

  setUpTheme = () => {
    let theme;
    if (typeof this.props.theme === 'string') {
      if (typeof themes[this.props.theme] !== 'undefined') {
        theme = themes[this.props.theme];
      } else {
        theme = themes.nicinabox;
      }
    } else {
      theme = this.props.theme;
    }

    return theme;
  }

  render() {
    const { currentStateIndex, computedStates } = this.props;
    let theme = this.setUpTheme();

    return (
      <div style={this.containerStyle(theme)}>
        { this.state.timer ? this.renderPauseButton(theme) : this.renderPlayButton(theme) }
        <div style={{ width: '80%', height: '100%' }}>
          <Slider
            min={0}
            max={computedStates.length - 1}
            value={currentStateIndex}
            onChange={this.handleSliderChange}
            theme={theme}
          />
        </div>
        { this.renderStepLeftButton(theme) }
        { this.renderStepRightButton(theme) }
        { this.renderPlaybackSpeedButton(theme) }
        <a onClick={this.handleReset}
           style={{ textDecoration: 'underline', cursor: 'hand', color: theme.base06, paddingBottom: 50 }}>
          <small>Reset</small>
        </a>
      </div>
    );
  }
}
