import React from 'react';
import HoverDims from './HoverDims';
import HoverRules from './HoverRules';
import { createHoveredStyles } from '../../utils/hoverStyles';

interface HoverProps {
  hover: any;
  selection: any;
  artboard: any;
}

const Hover = (props: HoverProps) => (
  <div
    className='c-layer c-layer--hover'
    style={createHoveredStyles(props.hover.frame)}>
    {
      props.selection
      ? <HoverRules hover={props.hover} selection={props.selection} />
      : <HoverDims hover={props.hover} artboard={props.artboard} />
    }
  </div>
);

export default Hover;
