import { Button, Checkbox } from '@/components/uikit';
import React, { useEffect, useState } from 'react';
import { ModalStep } from '../ModalContent';
import DatePicker, { DateObject, Value } from 'react-multi-date-picker';

interface Props {
  setModalStep: (arg: ModalStep) => void;
  handleModal: (arg: boolean) => void;
}

export const ContractDates = ({ setModalStep }: Props) => {
  const [dates, setDates] = useState({
    execution: '',
    start: '',
    end: '',
    renewal: '',
    trigger: '',
  });

  const [date, setDate] = useState<Value>(new DateObject());
  const [range, setRange] = useState<any>([new DateObject(), new DateObject()]);
  const [anotherDate, setAnotherDate] = useState<boolean>(false);

  useEffect(() => {
    if (range.length > 1) {
      const start = range[0].format();
      const end = range[1].format();
      setDates({ ...dates, start, end });
    }
  }, [range]);

  const handleExecution = (val: any) => {
    if (val) {
      const formatted = val.format();
      setDates({ ...dates, execution: formatted });
    }
  };

  const handleTrigger = (val: any) => {
    if (val) {
      const formatted = val.format();
      setDates({ ...dates, trigger: formatted });
    }
  };

  const handleRenewal = (val: any) => {
    if (val) {
      const formatted = val.format();
      setDates({ ...dates, renewal: formatted });
    }
  };

  const handleAnotherDate = (val: any) => {
    if (val) {
      const formatted = val.format();
      setDates((prevState) => ({ ...dates, additional: formatted }));
    }
    console.log('datezz', dates);
  };

  const datePickerStyles = {
    height: '40px',
    borderRadius: '4px',
    borderColor: '#d7dfe4',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col gap-[16px] grow justify-center">
      <h2>Choose contract dates</h2>
      <div className="flex flex-col gap-labelInput">
        <label className="text-[15px] text-grayDark">Execution Date:</label>
        <DatePicker
          value={date}
          onChange={(value) => handleExecution(value)}
          format="DD.MM.YYYY"
          style={datePickerStyles}
        />
      </div>
      <div className="flex flex-col gap-labelInput">
        <label className="text-[15px] text-grayDark">Trigger Date:</label>
        <DatePicker
          value={date}
          onChange={(value) => handleTrigger(value)}
          format="DD.MM.YYYY"
          style={datePickerStyles}
        />
      </div>
      <div className="flex flex-col gap-labelInput">
        <label className="text-[15px] text-grayDark">Start/End:</label>
        <DatePicker
          value={range}
          range
          dateSeparator="   to  "
          onChange={setRange}
          format="DD.MM.YYYY"
          style={datePickerStyles}
        />
      </div>
      <div className="flex flex-col gap-labelInput">
        <label className="text-[15px] text-grayDark">Renewal:</label>
        <DatePicker
          value={date}
          minDate={dates.end}
          onChange={(value) => handleRenewal(value)}
          format="DD.MM.YYYY"
          style={datePickerStyles}
        />
      </div>
      <div className="flex flex-col gap-labelInput">
        <Checkbox
          value={anotherDate}
          check={() => setAnotherDate(!anotherDate)}
          label="Do you want to add another trigger date?"
        />
        {anotherDate && (
          <DatePicker
            value={date}
            onChange={(value) => handleAnotherDate(value)}
            format="DD.MM.YYYY"
            style={datePickerStyles}
          />
        )}
      </div>
      <div className="flex flex-row justify-end gap-[8px]">
        <Button text="Back" onClick={() => setModalStep(ModalStep.general)} />
        <Button text="Next" color="dark" onClick={() => setModalStep(ModalStep.userInfo)} />
      </div>
    </div>
  );
};
