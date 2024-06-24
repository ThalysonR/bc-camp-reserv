import { fromNotification } from './src';
import * as reservationDetails from './reservationDetails.json';

export const handler = async () => {
  fromNotification(reservationDetails);
};
