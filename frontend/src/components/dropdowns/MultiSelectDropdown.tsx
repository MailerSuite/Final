import Select, { type PropsValue } from 'react-select'

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export default function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
}: MultiSelectDropdownProps) {
  const selected = options.filter((o) => value.includes(o.value))

  const handleChange = (vals: PropsValue<MultiSelectOption>) => {
    const arr = Array.isArray(vals) ? vals.map((v) => v.value) : []
    onChange(arr)
  }

  return (
    <Select
      isMulti
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder={placeholder}
      classNamePrefix="react-select"
      closeMenuOnSelect={false}
    />
  )
}
