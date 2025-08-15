import React from 'react'
import { format } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  showTime?: boolean
  format?: string
  className?: string
  label?: string
  error?: string
  required?: boolean
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled = false,
  minDate,
  maxDate,
  showTime = true,
  format: dateFormat = 'PPP p',
  className,
  label,
  error,
  required = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState({
    hours: value ? value.getHours().toString().padStart(2, '0') : '09',
    minutes: value ? value.getMinutes().toString().padStart(2, '0') : '00',
  })

  // Generate hour options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  // Generate minute options (every 5 minutes)
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)
      if (showTime) {
        newDate.setHours(parseInt(timeValue.hours, 10))
        newDate.setMinutes(parseInt(timeValue.minutes, 10))
      }
      setSelectedDate(newDate)
      onChange(newDate)
    } else {
      setSelectedDate(undefined)
      onChange(undefined)
    }
  }

  const handleTimeChange = (type: 'hours' | 'minutes', newValue: string) => {
    const newTimeValue = { ...timeValue, [type]: newValue }
    setTimeValue(newTimeValue)

    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(newTimeValue.hours, 10))
      newDate.setMinutes(parseInt(newTimeValue.minutes, 10))
      setSelectedDate(newDate)
      onChange(newDate)
    }
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    onChange(undefined)
    setIsOpen(false)
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, showTime ? dateFormat : 'PPP')
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 glass-card" align="start">
          <div className="p-3">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
            />
            
            {showTime && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={timeValue.hours} onValueChange={(value) => handleTimeChange('hours', value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">:</span>
                  
                  <Select value={timeValue.minutes} onValueChange={(value) => handleTimeChange('minutes', value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-3 border-t mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

// Quick date picker without time
export const DatePicker: React.FC<Omit<DateTimePickerProps, 'showTime'>> = (props) => {
  return <DateTimePicker {...props} showTime={false} format="PPP" />
}

// Time picker only
export const TimePicker: React.FC<Omit<DateTimePickerProps, 'showTime' | 'minDate' | 'maxDate'>> = ({
  value,
  onChange,
  placeholder = 'Pick a time',
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState({
    hours: value ? value.getHours().toString().padStart(2, '0') : '09',
    minutes: value ? value.getMinutes().toString().padStart(2, '0') : '00',
  })

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

  const handleTimeChange = (type: 'hours' | 'minutes', newValue: string) => {
    const newTimeValue = { ...timeValue, [type]: newValue }
    setTimeValue(newTimeValue)

    const newDate = new Date()
    newDate.setHours(parseInt(newTimeValue.hours, 10))
    newDate.setMinutes(parseInt(newTimeValue.minutes, 10))
    newDate.setSeconds(0, 0)
    onChange(newDate)
  }

  return (
    <div className={props.className}>
      {props.label && (
        <Label className="text-sm font-medium mb-2 block">
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={props.disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? format(value, 'p') : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-3 glass-card" align="start">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select Time</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeValue.hours} onValueChange={(value) => handleTimeChange('hours', value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-muted-foreground">:</span>
            
            <Select value={timeValue.minutes} onValueChange={(value) => handleTimeChange('minutes', value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="w-full mt-3"
          >
            Done
          </Button>
        </PopoverContent>
      </Popover>

      {props.error && (
        <p className="text-sm text-destructive mt-1">{props.error}</p>
      )}
    </div>
  )
}

export default DateTimePicker