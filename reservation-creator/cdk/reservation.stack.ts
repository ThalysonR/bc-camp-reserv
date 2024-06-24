import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ReservationConstruct } from './reservation.construct';

export class ReservationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new ReservationConstruct(this, 'camp-reservation');
  }
}
