import React, { Component, PropTypes } from 'react';

export default class SliderButton extends Component {
  static propTypes = {
    theme: PropTypes.object,
    replaySpeed: PropTypes.string,
    type: PropTypes.string,
    onClick: PropTypes.func
  }

  iconStyle() {
    return {
      cursor: 'hand',
      fill: this.props.theme.base06,
      width: '2.3rem',
      height: '2.3rem'
    };
  }

  renderPlayButton() {
    return (
      <a onClick={this.props.onClick} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle()}
        >
          <g><path d='M8 5v14l11-7z'></path></g>
        </svg>
      </a>
    );
  }

  renderPauseButton = () => {
    return (
      <a onClick={this.props.onClick} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle()}
        >
          <g><path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'></path></g>
        </svg>
      </a>
    );
  }

  renderStepButton = (direction) => {
    const d = direction === 'left' ?
      'M15.41 16.09l-4.58-4.59 4.58-4.59-1.41-1.41-6 6 6 6z' :
      'M8.59 16.34l4.58-4.59-4.58-4.59 1.41-1.41 6 6-6 6z';

    return (
      <a onClick={this.props.onClick} style={{ paddingBottom: 50 }}>
        <svg viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' fit
          style={this.iconStyle()}
        >
          <g><path d={d}></path></g>
        </svg>
      </a>
    );
  }

  renderPlaybackSpeedButton = () => {
    const style = {
      cursor: 'hand',
      color: this.props.theme.base06,
      fontSize: this.props.replaySpeed === 'Live' ? '1.1em' : '1.8em',
      paddingBottom: 50
    };

    return (
      <div style={style} onClick={this.props.onClick}>
        { this.props.replaySpeed }
      </div>
    );
  }

  render() {
    switch (this.props.type) {
      case 'play':
        return this.renderPlayButton();
      case 'pause':
        return this.renderPauseButton();
      case 'stepLeft':
        return this.renderStepButton('left');
      case 'stepRight':
        return this.renderStepButton('right');
      case 'playBackSpeed':
        return this.renderPlaybackSpeedButton();
      default:
        return null;
    }
  }
}
