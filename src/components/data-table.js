import React from 'react';
import { Container } from 'reactstrap';
import DataTable from '@bit/adeoy.utils.data-table';

import "bootstrap/dist/css/bootstrap.min.css";

const App = (props) => {
  const data = [];
  console.log('da');
    console.log(props.transactions);
  const columns = [
    { title: "First name", data: "transaction_amount" },
    { title: "Gender", data: "transaction_date" },
    { title: "IP address", data: "available_amount" },
  ];

  const click = (row) => {
    console.log(row);
  };

  return (
    <>
      <h5 className="mt-2 mb-4 text-center">Simple React DataTable</h5>
      <DataTable
        data={data}
        columns={columns}
        striped={true}
        hover={true}
        responsive={true}
        onClickRow={click}
      />
    </>
  );
};

export default App;
