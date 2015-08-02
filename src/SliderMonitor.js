import React, { PropTypes, findDOMNode, Component } from 'react';
import Slider from './Slider';

export default class SliderMonitor extends Component {
  constructor(props) {
    super(props);

    window.addEventListener('keydown', ::this.handleKeyPress);

    this.state = {
      timer: undefined
    };
  }

  static propTypes = {
    computedStates: PropTypes.array.isRequired,
    currentStateIndex: PropTypes.number.isRequired,
    monitorState: PropTypes.object.isRequired,
    stagedActions: PropTypes.array.isRequired,
    skippedActions: PropTypes.object.isRequired,
    reset: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    rollback: PropTypes.func.isRequired,
    sweep: PropTypes.func.isRequired,
    toggleAction: PropTypes.func.isRequired,
    jumpToState: PropTypes.func.isRequired,
    setMonitorState: PropTypes.func.isRequired,
    select: PropTypes.func.isRequired
  };

  static defaultProps = {
    select: (state) => state,
    monitorState: { isVisible: true }
  };

  componentWillReceiveProps(nextProps) {
    const node = findDOMNode(this);
    if (!node) {
      this.scrollDown = true;
    } else if (
      this.props.stagedActions.length < nextProps.stagedActions.length
    ) {
      const scrollableNode = node.parentElement;
      const { scrollTop, offsetHeight, scrollHeight } = scrollableNode;

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
      const scrollableNode = node.parentElement;
      const { offsetHeight, scrollHeight } = scrollableNode;

      scrollableNode.scrollTop = scrollHeight - offsetHeight;
      this.scrollDown = false;
    }
  }

  handleRollback() {
    this.props.rollback();
  }

  handleSweep() {
    this.props.sweep();
  }

  handleCommit() {
    this.props.commit();
  }

  handleToggleAction(index) {
    this.props.toggleAction(index);
  }

  handleReset() {
    this.props.reset();
  }

  handleKeyPress(event) {
    const { monitorState } = this.props;

    if (event.ctrlKey && event.keyCode === 72) { // Ctrl+H
      event.preventDefault();
      this.props.setMonitorState({
        ...monitorState,
        isVisible: !monitorState.isVisible
      });
    }
  }

  handleSliderChange(value) {
    if (this.state.timer) {
      this.pauseReplay();
    }

    this.props.jumpToState(value);
  }

  startReplay() {
    if (this.state.timer) {
      return;
    }

    let currentStateIndex;
    if (this.props.currentStateIndex === this.props.computedStates.length - 1) {
      this.props.jumpToState(0);
      currentStateIndex = 0;
    } else {
      this.props.jumpToState(this.props.currentStateIndex + 1);
      currentStateIndex = this.props.currentStateIndex + 1;
    }

    let counter = currentStateIndex === 0 ? 1 : currentStateIndex + 1;
    let timer = setInterval(() => {
      this.props.jumpToState(counter);

      if (counter === this.props.computedStates.length - 1) {
        clearInterval(this.state.timer);
        this.setState({
          timer: undefined
        });
      }
      counter++;
    }, 500);

    this.setState({ timer });
  }

  pauseReplay() {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.setState({
        timer: undefined
      });
    }
  }

  containerStyle() {
    return {
      fontFamily: 'monospace',
      position: 'relative',
      padding: '1.5rem',
      display: 'flex'
    };
  }

  iconStyle() {
    return {
      cursor: 'hand',
      fill: 'white',
      width: '2.3rem',
      height: '2.3rem'
    };
  }

  renderPlayButton() {
    return (
      <a onClick={::this.startReplay}>
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fit
          style={this.iconStyle()}
        >
          <g><path d="M8 5v14l11-7z"></path></g>
        </svg>
      </a>
    );
  }

  renderPauseButton() {
    return (
      <a onClick={::this.pauseReplay}>
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fit
          style={this.iconStyle()}
        >
          <g><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></g>
        </svg>
      </a>
    );
  }

  render() {
    const { monitorState, currentStateIndex, computedStates } = this.props;

    if (!monitorState.isVisible) {
      return null;
    }

    return (
      <div style={this.containerStyle()}>
        { this.state.timer ? this.renderPauseButton() : this.renderPlayButton()}
        <div style={{ width: '70%' }}>
          <Slider
            min={0}
            max={computedStates.length - 1}
            value={currentStateIndex}
            onChange={::this.handleSliderChange}
          />
        </div>
        <a onClick={::this.handleReset}
           style={{ textDecoration: 'underline', cursor: 'hand' }}>
          <small>Reset</small>
        </a>
      </div>
    );
  }
}
