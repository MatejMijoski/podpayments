import {React,Component} from 'react';
import axios from 'axios';
import { Redirect } from "react-router-dom";
import PayPal from '../components/PayPal';
import './home.css';

import KEYS from "../settings.js";
import { Container } from 'reactstrap';
import DataTable from '@bit/adeoy.utils.data-table';
import { Grid,
  Avatar,
  Box,
  Card,
  CardContent, } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { useState, useEffect } from 'react';
import { TokenExpiration } from '../util'
import "bootstrap/dist/css/bootstrap.min.css";
import { makeStyles } from '@material-ui/core/styles';
import Budget from '../components/FundsComponent';



class HistoryPayments extends Component{

constructor(props){
        super(props);
        this.state = {
            transactions: [],
            amount: [],
            loading: true,
            redirect: "/signin",
            showPayPal:false,
            failed: false,
            timeCreated: "",
            currentTime: "",
        };

        this.setupBeforeUnloadListener = this.setupBeforeUnloadListener.bind(this)
        this.OnClick = this.OnClick.bind(this);
        TokenExpiration(KEYS.API_URL);
    }

    setupBeforeUnloadListener = () => {
        window.addEventListener("beforeunload", (ev) => {
            ev.preventDefault();
             axios
            .get( KEYS.API_URL + 'api/logout/',{
                headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
            })
            sessionStorage.clear();
        });
    };

    componentDidMount(){
        axios.get( KEYS.API_URL + 'api/',{
            headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
        }).then(res => {
             setTimeout(() => {
                        this.setState({ amount: res.data});
                        }, 800)
        })

        axios.get( KEYS.API_URL + 'api/payments/?type=company',{
            headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
        }).then(res => {
             setTimeout(() => {
                        this.setState({ transactions: res.data, loading: false});
                        }, 500)
        })

     }

    OnClick(event){
        event.preventDefault();
        if(event.target.dataset.type == "failed-transactions"){
           this.setState({failed:true});
        }else{
            this.setState({failed:false});
        }
        axios.get(KEYS.API_URL + 'api/payments/?type=' + event.target.dataset.type,{
            headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
        })
          .then(res => {
             setTimeout(() => {
                        this.setState({ transactions: res.data, loading: false });
                        }, 500)

          })
    }


  useStyles = makeStyles((theme) => ({
  root1: {
    flexGrow: 1,
  },
}));

    render(){
        if(!sessionStorage.getItem('token') && sessionStorage.getItem('token') === null){
            return <Redirect to={this.state.redirect} />;
        }

        return(
       <div>

           {this.state.loading ? null : (
          <Container>
            <Grid container xl={12} lg={12} xs={12} sm={12} style={{margin:"70px auto"}} className={this.useStyles.root1} >
                <Grid item xl={6} lg={6} sm={9} xs={12}  style={{margin:"auto", textAlign:"center"}}>
                            <Budget funds={this.state.amount.available_amount} text="Available Funds"/>
                            <Budget funds={this.state.amount.failed_transactions_amount} text="Failed Transactions Funds"/>
                </Grid>
                <Grid item xl={6} lg={6} xs={12} sm={12} style={{margin:"auto", textAlign:"center"}}>
                    <Card xs={6} lg={12} xs={12} sm={12} >
                      <CardContent style={{padding:'40px 15px', background: "#ffffffe0", borderRadius:"10px"}}>
                         <PayPal />
                      </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <hr/>
             <Container style={{textAlign:"center"}}>
            <button className="btn btn-outline-primary btns" onClick={this.OnClick} data-type="client">Client</button>
            <button className="btn btn-outline-primary btns" onClick={this.OnClick} data-type="company">Company</button>
            <button className="btn btn-outline-primary btns" onClick={this.OnClick} data-type="failed-transactions">Failed Transactions</button>
            </Container>
            <Container style={{background:"white", padding:"10px 15px", borderRadius:"10px"}}>
             {this.state.transactions.length > 0 ?
                <App failed={this.state.failed} transactions={this.state.transactions} /> :
                ( <Typography style={{margin:"18px", padding:"8px"}} variant="h5" color="textSecondary" align="center">
                      There are no transactions.
                  </Typography>
                  )
              }
              </Container>
          </Container>
        )}

        </div>
        );
    }
}

export default HistoryPayments;

function App({transactions, failed}){
   var data = transactions;
   if(transactions.length){
        Object.keys(transactions).forEach((key)=>{
        var date = new Date(transactions[key].transaction_date);
            transactions[key].transaction_date = '' + date + '';
        });
    }


const columns = [
        { title: "Transaction Amount", data: "transaction_amount" },
         { title: "Transaction Date", data: "transaction_date" },
  ];

 if(failed){
    columns.push({ title: "Order ID", data: 'order_id'});
  }else{
      columns.push({ title: "Available Amount (after transaction)", data: 'available_amount'});
  }


  return (
    <>
      <h5 className="mt-2 mb-4 text-center">Recent Transactions</h5>
      <DataTable
        data={data}
        columns={columns}
        striped={true}
        hover={true}
        responsive={true}
      />
    </>
  );
};


