import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { TableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';

export class ReservationConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const reservationFunction = new NodejsFunction(this, 'createReservation', {
      code: Code.fromAsset('lambda'),
      handler: 'createReservation.handler'
    });

    const table = new TableV2(this, 'Table', {
      partitionKey: { name: 'id', type: AttributeType.STRING }
    });
  }
}
