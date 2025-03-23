import React, { RefObject, memo, useState } from 'react';

import { IconButton } from 'widgets/button';
import { IconSet } from 'widgets/icons';
import { InfoButton } from 'widgets/notifications';
import { KeySelector, OperatorSelector, ValueInput } from './Inputs';
import { QueryDispatch } from './QueryEditor';
import { defaultQuery, generateCriteriaId } from './data';

export interface QueryBuilderProps {
  keySelector: RefObject<HTMLSelectElement>;
  dispatch: QueryDispatch;
}

const CriteriaBuilder = memo(function QueryBuilder({ keySelector, dispatch }: QueryBuilderProps) {
  const [criteria, setCriteria] = useState(defaultQuery('tags'));

  const add = () => {
    dispatch((query) => new Map(query.set(generateCriteriaId(), criteria)));
    setCriteria(defaultQuery('tags'));
    keySelector.current?.focus();
  };

  return (
    <fieldset aria-labelledby="criteria-builder-label">
      <legend id="criteria-builder-label">
        条件生成器
        <InfoButton>
          一个条件由三个部分组成
          <ul>
            <li>
              <b>键</b> (图像文件的属性，如名称、路径等等),
            </li>
            <li>
              <b>逻辑要求</b> (决定如何比较属性值)
            </li>
            <li>
              要求匹配的<b>值</b>.
            </li>
          </ul>
          将显示符合条件的每张图像。
          <br />
          <br />
          您可以编辑每个组件的输入项，并通过按下输入框旁的{' '}
          <span aria-label="add criteria" style={{ verticalAlign: 'middle' }}>
            {IconSet.ADD}
          </span>{' '}
          图标按钮，将条件添加到查询中。
        </InfoButton>
      </legend>
      <div id="criteria-builder">
        <label id="builder-key">键</label>
        <label id="builder-operator">逻辑要求</label>
        <label id="builder-value">值</label>
        <span></span>

        <KeySelector
          labelledby="builder-key"
          ref={keySelector}
          keyValue={criteria.key}
          dispatch={setCriteria}
        />
        <OperatorSelector
          labelledby="builder-operator"
          keyValue={criteria.key}
          value={criteria.operator}
          dispatch={setCriteria}
        />
        <ValueInput
          labelledby="builder-value"
          keyValue={criteria.key}
          value={criteria.value}
          dispatch={setCriteria}
        />
        <IconButton text="Add Criteria" icon={IconSet.ADD} onClick={add} />
      </div>
    </fieldset>
  );
});

export default CriteriaBuilder;
