import React from 'react';
import { createRuleRightStyles, createDimRightLeftStyles } from '../../utils/selectionStyles';

interface SelectionRulesRightProps {
  selectionOrigin: any;
  hoverOrigin: any;
  artboardFrame: any;
}

class SelectionRulesRight extends React.Component<SelectionRulesRightProps, {}> {
  render() {
    const { selectionOrigin, hoverOrigin, artboardFrame } = this.props;
    return (
      <div
        className='c-selection__rule c-selection__rule--r'
        style={createRuleRightStyles(selectionOrigin, hoverOrigin)}>
        <div
          className='c-selection__dim'
          style={createDimRightLeftStyles(selectionOrigin, artboardFrame)}>
          {
            selectionOrigin.right >= hoverOrigin.left
            ? `${hoverOrigin.right - selectionOrigin.right}px`
            : `${hoverOrigin.left - selectionOrigin.right}px`
          }
        </div>
      </div>
    );
  }
}

export default SelectionRulesRight;
