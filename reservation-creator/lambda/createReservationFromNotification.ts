import { SQSHandler } from 'aws-lambda';
import { fromNotification } from './src';
import * as reservationDetails from './reservationDetails.json';

export const handler: SQSHandler = async () => {
  fromNotification(reservationDetails);
};
