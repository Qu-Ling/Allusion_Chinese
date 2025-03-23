import { action } from 'mobx';
import React, { ForwardedRef, forwardRef, useState } from 'react';

import { camelCaseToSpaced } from 'common/fmt';
import { NumberOperators, StringOperators } from '../../../api/data-storage-search';
import { IMG_EXTENSIONS } from '../../../api/file';
import { BinaryOperators, TagOperators } from '../../../api/search-criteria';
import { TagSelector } from '../../components/TagSelector';
import { useStore } from '../../contexts/StoreContext';
import { NumberOperatorSymbols, StringOperatorLabels } from '../../entities/SearchCriteria';
import { ClientTag } from '../../entities/Tag';
import { Criteria, Key, Operator, TagValue, Value, defaultQuery } from './data';

type SetCriteria = (fn: (criteria: Criteria) => Criteria) => void;

interface IKeySelector {
  labelledby: string;
  dispatch: SetCriteria;
  keyValue: Key;
}

export const KeySelector = forwardRef(function KeySelector(
  { labelledby, keyValue, dispatch }: IKeySelector,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as Key;
    dispatch((criteria) => {
      // Keep the text value and operator when switching between name and path
      if ([criteria.key, key].every((k) => ['name', 'absolutePath'].includes(k))) {
        criteria.key = key;
        return { ...criteria };
      } else {
        return defaultQuery(key);
      }
    });
  };

  return (
    <select
      className="criteria-input"
      ref={ref}
      aria-labelledby={labelledby}
      onChange={handleChange}
      value={keyValue}
    >
      <option key="tags" value="tags">
        标签
      </option>
      <option key="name" value="name">
        文件名
      </option>
      <option key="absolutePath" value="absolutePath">
        文件路径
      </option>
      <option key="extension" value="extension">
        文件类型
      </option>
      <option key="size" value="size">
        文件大小 (MB)
      </option>
      <option key="width" value="width">
        宽度
      </option>
      <option key="height" value="height">
        长度
      </option>
      <option key="dateAdded" value="dateAdded">
        添加日期
      </option>
    </select>
  );
});

type FieldInput<V> = IKeySelector & { value: V };

export const OperatorSelector = ({
  labelledby,
  keyValue,
  value,
  dispatch,
}: FieldInput<Operator>) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const operator = e.target.value as Operator;
    dispatch((criteria) => {
      criteria.operator = operator;
      return { ...criteria };
    });
  };

  return (
    <select
      className="criteria-input"
      aria-labelledby={labelledby}
      onChange={handleChange}
      value={value}
    >
      {getOperatorOptions(keyValue)}
    </select>
  );
};

export const ValueInput = ({ labelledby, keyValue, value, dispatch }: FieldInput<Value>) => {
  if (keyValue === 'name' || keyValue === 'absolutePath') {
    return <PathInput labelledby={labelledby} value={value as string} dispatch={dispatch} />;
  } else if (keyValue === 'tags') {
    return <TagInput labelledby={labelledby} value={value as TagValue} dispatch={dispatch} />;
  } else if (keyValue === 'extension') {
    return <ExtensionInput labelledby={labelledby} value={value as string} dispatch={dispatch} />;
  } else if (['size', 'width', 'height'].includes(keyValue)) {
    return <NumberInput labelledby={labelledby} value={value as number} dispatch={dispatch} />;
  } else if (keyValue === 'dateAdded') {
    return <DateAddedInput labelledby={labelledby} value={value as Date} dispatch={dispatch} />;
  }
  return <p>This should never happen.</p>;
};

type ValueInput<V> = Omit<FieldInput<V>, 'keyValue'>;

const PathInput = ({ labelledby, value, dispatch }: ValueInput<string>) => {
  return (
    <input
      aria-labelledby={labelledby}
      className="input criteria-input"
      type="text"
      defaultValue={value}
      onBlur={(e) => dispatch(setValue(e.target.value))}
    />
  );
};

const TagInput = ({ value, dispatch }: ValueInput<TagValue>) => {
  const { tagStore } = useStore();
  const [selection, setSelection] = useState(value !== undefined ? tagStore.get(value) : undefined);

  const handleSelect = action((t: ClientTag) => {
    dispatch(setValue(t.id));
    setSelection(t);
  });

  const handleDeselect = () => {
    dispatch(setValue(undefined));
    setSelection(undefined);
  };

  // TODO: tooltips don't work; they're behind the dialog, arghghgh
  return (
    <TagSelector
      selection={selection ? [selection] : []}
      onSelect={handleSelect}
      onDeselect={handleDeselect}
      onClear={handleDeselect}
    />
  );
};

const ExtensionInput = ({ labelledby, value, dispatch }: ValueInput<string>) => (
  <select
    className="criteria-input"
    aria-labelledby={labelledby}
    onChange={(e) => dispatch(setValue(e.target.value))}
    value={value}
  >
    {IMG_EXTENSIONS.map((ext) => (
      <option key={ext} value={ext}>
        {ext.toUpperCase()}
      </option>
    ))}
  </select>
);

const NumberInput = ({ value, labelledby, dispatch }: ValueInput<number>) => {
  return (
    <input
      aria-labelledby={labelledby}
      className="input criteria-input"
      type="number"
      defaultValue={value}
      min={0}
      onChange={(e) => {
        const value = e.target.valueAsNumber;
        if (value) {
          dispatch(setValue(value));
        }
      }}
    />
  );
};

const DateAddedInput = ({ value, labelledby, dispatch }: ValueInput<Date>) => {
  return (
    <input
      aria-labelledby={labelledby}
      className="input criteria-input"
      type="date"
      max={new Date().toISOString().slice(0, 10)}
      defaultValue={value.toISOString().slice(0, 10)}
      onChange={(e) => {
        if (e.target.valueAsDate) {
          dispatch(setValue(e.target.valueAsDate));
        }
      }}
    />
  );
};

function getOperatorOptions(key: Key) {
  if (['dateAdded', 'size', 'width', 'height'].includes(key)) {
    return NumberOperators.map((op) => toOperatorOption(op, NumberOperatorSymbols));
  } else if (key === 'extension') {
    return BinaryOperators.map((op) => toOperatorOption(op));
  } else if (key === 'name' || key === 'absolutePath') {
    return StringOperators.map((op) => toOperatorOption(op, StringOperatorLabels));
  } else if (key === 'tags') {
    return TagOperators.map((op) => toOperatorOption(op));
  }
  return [];
}

const toOperatorOption = <T extends string>(o: T, labels?: Record<T, string>) => (
  <option key={o} value={o}>
    {labels && o in labels ? labels[o] : camelCaseToSpaced(o)}
  </option>
);

function setValue(value: Value): (criteria: Criteria) => Criteria {
  return (criteria: Criteria): Criteria => {
    criteria.value = value;
    return { ...criteria };
  };
}
