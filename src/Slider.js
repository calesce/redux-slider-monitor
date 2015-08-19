import React, { Children, Component, PropTypes } from 'react';

export default class Slider extends Component {
  constructor(props) {
    super(props);

    let value = this.orChildrenCount(this.ensureArray(this.props.value), this.ensureArray(this.props.defaultValue));
    // reused throughout the component to store results of iterations over `value`
    this.tempArray = value.slice();

    let zIndices = [];
    for (let i = 0; i < value.length; i++) {
      value[i] = this.trimAlignValue(value[i], this.props);
      zIndices.push(i);
    }

    this.state = {
      index: -1,
      upperBound: 0,
      sliderLength: 0,
      value: value,
      zIndices: zIndices
    };
  }

  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    minDistance: PropTypes.number,
    defaultValue: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number)
    ]),
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number)
    ]),
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    disabled: PropTypes.bool,
    snapDragDisabled: PropTypes.bool,
    onBeforeChange: PropTypes.func,
    onChange: PropTypes.func,
    onAfterChange: PropTypes.func,
    onSliderClick: PropTypes.func
  };

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    minDistance: 0,
    defaultValue: 0,
    orientation: 'horizontal',
    disabled: false,
    snapDragDisabled: false
  };

  pauseEvent = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
  }

  stopPropagation = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
  }

  linspace(min, max, count) {
    let range = (max - min) / (count - 1);
    let res = [];
    for (let i = 0; i < count; i++) {
      res.push(min + range * i);
    }
    return res;
  }

  ensureArray(x) {
    if (x === null) {
      return [];
    }
    if (Array.isArray(x)) {
      return x;
    }
    return [x];
  }

  undoEnsureArray(x) {
    return x !== null && x.length === 1 ? x[0] : x;
  }

  orChildrenCount = (value, defaultValue) => {
    let count = Children.count(this.props.children);
    switch (count) {
      case 0:
        return value.length > 0 ? value : defaultValue;
      case value.length:
        return value;
      case defaultValue.length:
        return defaultValue;
      default:
        if (value.length !== count || defaultValue.length !== count) {
          console.warn(this.constructor.displayName + ': Number of values does not match number of children.');
        }
        return this.linspace(this.props.min, this.props.max, count);
    }
  }

  componentDidMount = () => {
    let slider = React.findDOMNode(this.refs.slider);
    let handle = React.findDOMNode(this.refs.handle);
    let rect = slider.getBoundingClientRect();

    let size = this.sizeKey();

    let sliderMax = rect[this.posMaxKey()];
    let sliderMin = rect[this.posMinKey()];

    this.setState({
      upperBound: slider[size] - handle[size],
      sliderLength: Math.abs(sliderMax - sliderMin),
      handleSize: handle[size],
      sliderStart: this.props.handleResize ? sliderMax : sliderMin
    });
  }

  getValue = () => {
    return this.undoEnsureArray(this.state.value);
  }

  // calculates the offset of a handle in pixels based on its value.
  calcOffset = (value) => {
    let dividend = (this.props.max - this.props.min === 0) ? 1 : this.props.max - this.props.min;
    let ratio = (value - this.props.min) / dividend;
    return ratio * this.state.upperBound;
  }

  // calculates the value corresponding to a given pixel offset, i.e. the inverse of `calcOffset`.
  calcValue = (offset) => {
    let ratio = offset / this.state.upperBound;
    return ratio * (this.props.max - this.props.min) + this.props.min;
  }

  buildHandleStyle = (offset) => {
    return {
      position: 'absolute',
      willChange: this.state.index >= 0 ? this.posMinKey() : '',
      zIndex: 1,
      background: this.props.theme.base06,
      cursor: 'hand',
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      marginTop: '20px',
      [this.posMinKey()]: offset
    };
  }

  buildBarStyle = () => {
    return {
      position: 'absolute',
      willChange: this.state.index >= 0 ? this.posMinKey() + ',' + this.posMaxKey() : '',
      background: this.props.theme.base06,
      top: '60%',
      height: '10%',
      width: '98%',
      left: 7,
      cursor: 'hand'
    };
  }

  getClosestIndex = (pixelOffset) => {
    let minDist = Number.MAX_VALUE;
    let closestIndex = -1;

    let value = this.state.value;
    let l = value.length;

    for (let i = 0; i < l; i++) {
      let offset = this.calcOffset(value[i]);
      let dist = Math.abs(pixelOffset - offset);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  calcOffsetFromPosition = (position) => {
    let pixelOffset = position - this.state.sliderStart;
    pixelOffset -= (this.state.handleSize / 2);
    return pixelOffset;
  }

  // Snaps the nearest handle to the value corresponding to `position` and calls `callback` with that handle's index.
  forceValueFromPosition = (position, callback) => {
    let pixelOffset = this.calcOffsetFromPosition(position);
    let closestIndex = this.getClosestIndex(pixelOffset);
    let nextValue = this.trimAlignValue(this.calcValue(pixelOffset));

    let value = this.state.value.slice(); // Clone this.state.value since we'll modify it temporarily
    value[closestIndex] = nextValue;

    // Prevents the slider from shrinking below `props.minDistance`
    for (let i = 0; i < value.length - 1; i += 1) {
      if (value[i + 1] - value[i] < this.props.minDistance) return;
    }

    this.setState({value: value}, callback.bind(this, closestIndex));
  }

  getMousePosition = (e) => {
    return [
      e['page' + this.axisKey()],
      e['page' + this.orthogonalAxisKey()]
    ];
  }

  getTouchPosition = (e) => {
    let touch = e.touches[0];
    return [
      touch['page' + this.axisKey()],
      touch['page' + this.orthogonalAxisKey()]
    ];
  }

  getMouseEventMap = () => {
    return {
      'mousemove': this.onMouseMove,
      'mouseup': this.onMouseUp
    };
  }

  getTouchEventMap = () => {
    return {
      'touchmove': this.onTouchMove,
      'touchend': this.onTouchEnd
    };
  }

  // create the `mousedown` handler for the i-th handle
  createOnMouseDown = (i) => {
    return function createdOnMouseDown(e) {
      if (this.props.disabled) return;
      let position = this.getMousePosition(e);
      this.start(i, position[0]);
      this.addHandlers(this.getMouseEventMap());
      this.pauseEvent(e);
    }.bind(this);
  }

  // create the `touchstart` handler for the i-th handle
  createOnTouchStart = (i) => {
    return function createdOnTouchStart(e) {
      if (this.props.disabled || e.touches.length > 1) return;
      let position = this.getTouchPosition(e);
      this.startPosition = position;
      this.isScrolling = undefined; // don't know yet if the user is trying to scroll
      this.start(i, position[0]);
      this.addHandlers(this.getTouchEventMap());
      this.stopPropagation(e);
    }.bind(this);
  }

  addHandlers = (eventMap) => {
    for (let key in eventMap) {
      if ({}.hasOwnProperty.call(eventMap, key)) {
        document.addEventListener(key, eventMap[key], false);
      }
    }
  }

  removeHandlers = (eventMap) => {
    for (let key in eventMap) {
      if ({}.hasOwnProperty.call(eventMap, key)) {
        document.removeEventListener(key, eventMap[key], false);
      }
    }
  }

  start = (i, position) => {
    // if activeElement is body window will lost focus in IE9
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    this.hasMoved = false;

    this.fireChangeEvent('onBeforeChange');

    let zIndices = this.state.zIndices;
    zIndices.splice(zIndices.indexOf(i), 1); // remove wherever the element is
    zIndices.push(i); // add to end

    this.setState({
      startValue: this.state.value[i],
      startPosition: position,
      index: i,
      zIndices: zIndices
    });
  }

  onMouseUp = () => {
    this.onEnd(this.getMouseEventMap());
  }

  onTouchEnd = () => {
    this.onEnd(this.getTouchEventMap());
  }

  onEnd = (eventMap) => {
    this.removeHandlers(eventMap);
    this.setState({index: -1}, this.fireChangeEvent.bind(this, 'onAfterChange'));
  }

  onMouseMove = (e) => {
    let position = this.getMousePosition(e);
    this.move(position[0]);
  }

  onTouchMove = (e) => {
    if (e.touches.length > 1) return;

    let position = this.getTouchPosition(e);

    if (typeof this.isScrolling === 'undefined') {
      let diffMainDir = position[0] - this.startPosition[0];
      let diffScrollDir = position[1] - this.startPosition[1];
      this.isScrolling = Math.abs(diffScrollDir) > Math.abs(diffMainDir);
    }

    if (this.isScrolling) {
      this.setState({index: -1});
      return;
    }

    this.pauseEvent(e);

    this.move(position[0]);
  }

  move = (position) => {
    this.hasMoved = true;

    let { max, min } = this.props;
    let { index, value, startValue, sliderLength, handleSize } = this.state;
    let oldValue = value[index];

    let diffPosition = position - this.state.startPosition;

    let diffValue = diffPosition / (sliderLength - handleSize) * (max - min);
    let newValue = this.trimAlignValue(startValue + diffValue);

    value[index] = newValue;

    // Normally you would use `shouldComponentUpdate`, but since the slider is a low-level component,
    // the extra complexity might be worth the extra performance.
    if (newValue !== oldValue) {
      this.setState({value: value}, this.fireChangeEvent.bind(this, 'onChange'));
    }
  }

  pushSucceeding = (value, minDistance, index) => {
    let i;
    let padding;
    for (i = index, padding = value[i] + minDistance;
         value[i + 1] !== null && padding > value[i + 1];
         i++, padding = value[i] + minDistance) {
      value[i + 1] = this.alignValue(padding);
    }
  }

  trimSucceeding = (length, nextValue, minDistance, max) => {
    for (let i = 0; i < length; i++) {
      let padding = max - i * minDistance;
      if (nextValue[length - 1 - i] > padding) {
        nextValue[length - 1 - i] = padding;
      }
    }
  }

  pushPreceding = (value, minDistance, index) => {
    let i;
    let padding;
    for (i = index, padding = value[i] - minDistance;
         value[i - 1] !== null && padding < value[i - 1];
         i--, padding = value[i] - minDistance) {
      value[i - 1] = this.alignValue(padding);
    }
  }

  trimPreceding = (length, nextValue, minDistance, min) => {
    for (let i = 0; i < length; i++) {
      let padding = min + i * minDistance;
      if (nextValue[i] < padding) {
        nextValue[i] = padding;
      }
    }
  }

  axisKey = () => {
    let orientation = this.props.orientation;
    if (orientation === 'horizontal') return 'X';
    if (orientation === 'vertical') return 'Y';
  }

  orthogonalAxisKey = () => {
    return this.props.orientation === 'horizontal' ? 'Y' : 'X';
  }

  posMinKey = () => {
    return this.props.orientation === 'horizontal' ? 'left' : 'top';
  }

  posMaxKey = () => {
    return this.props.orientation === 'horizontal' ? 'right' : 'bottom';
  }

  sizeKey = () => {
    return this.props.orientation === 'horizontal' ? 'clientWidth' : 'clientHeight';
  }

  trimAlignValue = (val, props) => {
    return this.alignValue(this.trimValue(val, props), props);
  }

  trimValue = (val, props) => {
    let newProps = props || this.props;

    let newVal = val;
    if (val <= newProps.min) {
      newVal = newProps.min;
    }
    if (val >= newProps.max) {
      newVal = newProps.max;
    }

    return newVal;
  }

  alignValue = (val, props) => {
    let newProps = props || this.props;

    let valModStep = (val - newProps.min) % newProps.step;
    let alignValue = val - valModStep;

    if (Math.abs(valModStep) * 2 >= newProps.step) {
      alignValue += (valModStep > 0) ? newProps.step : (-newProps.step);
    }

    return parseFloat(alignValue.toFixed(5));
  }

  renderHandle = (child) => {
    let offset = this.calcOffset(this.props.value);

    return (
      <div
        ref={'handle'} key={'handle'}
        style={this.buildHandleStyle(offset)}
        onMouseDown={this.createOnMouseDown(0)}
        onTouchStart={this.createOnTouchStart(0)}
      >
        {child}
      </div>
    );
  }

  renderBar = () => {
    return <div key={'bar'} ref={'bar'} style={this.buildBarStyle()}></div>;
  }

  onSliderMouseDown = (e) => {
    if (this.props.disabled) return;
    this.hasMoved = false;
    if (!this.props.snapDragDisabled) {
      let position = this.getMousePosition(e);
      this.forceValueFromPosition(position[0], function forceValueFromPosition(i) {
        this.fireChangeEvent('onChange');
        this.start(i, position[0]);
        this.addHandlers(this.getMouseEventMap());
      }.bind(this));
    }

    this.pauseEvent(e);
  }

  onSliderClick = (e) => {
    if (this.props.disabled) return;

    if (this.props.onSliderClick && !this.hasMoved) {
      let position = this.getMousePosition(e);
      let valueAtPos = this.trimAlignValue(this.calcValue(this.calcOffsetFromPosition(position[0])));
      this.props.onSliderClick(valueAtPos);
    }
  }

  fireChangeEvent = (event) => {
    if (this.props[event]) {
      this.props[event](this.undoEnsureArray(this.state.value));
    }
  }

  renderValue = () => {
    const { value, min, max } = this.props;
    let style = {
      position: 'absolute',
      left: this.calcOffset(value) + 6
    };

    if (value !== min && value !== max) {
      return <small style={style}>{value}</small>;
    }
    return <small></small>;
  }

  render() {
    let bars = this.renderBar();
    let handle = this.renderHandle(null);
    let currentValue = this.renderValue();

    return (
      <div>
        <div ref='slider'
          style={{
            position: 'relative',
            width: '100%',
            height: '50px',
            marginBottom: '12px'
          }}
          onMouseDown={this.onSliderMouseDown}
          onClick={this.onSliderClick}
        >
          {bars}
          {handle}
        </div>
        <div style={{ position: 'relative', bottom: 10 }}>
          <small style={{ left: 7, position: 'absolute' }}>{this.props.min}</small>
          {currentValue}
          <small style={{ right: 5, position: 'absolute' }}>{this.props.max}</small>
        </div>
      </div>
    );
  }
}
