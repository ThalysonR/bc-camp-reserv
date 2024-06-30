import { Construct } from 'constructs';
import {
  NodejsFunction,
  NodejsFunctionProps
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { TableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Lambda, LambdaInvocationType } from 'aws-cdk-lib/aws-ses-actions';

export class ReservationConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const chromiumLayer = LayerVersion.fromLayerVersionArn(
      this,
      'chromium-lambda-layer',
      'arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:45'
    );
    const commonProps: NodejsFunctionProps = {
      memorySize: 1024,
      handler: 'handler',
      bundling: {
        externalModules: ['@sparticuz/chromium'],
        minify: true
      },
      layers: [chromiumLayer],
      timeout: Duration.minutes(15)
    };
    const reservationFunction = new NodejsFunction(this, 'createReservation', {
      functionName: 'CreateReservation',
      entry: './lambda/createReservation.ts',
      ...commonProps
    });

    const reservationFromNotificationFunction = new NodejsFunction(
      this,
      'createReservationFromNotification',
      {
        functionName: 'CreateReservationFromNotification',
        entry: './lambda/createReservationFromNotification.ts',
        ...commonProps
      }
    );

    const table = new TableV2(this, 'ReservationConfigTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING }
    });

    table.grantReadWriteData(reservationFunction);
    table.grantReadWriteData(reservationFromNotificationFunction);

    new ses.ReceiptRuleSet(this, `InboundEmailRuleset`, {
      rules: [
        {
          enabled: true,
          receiptRuleName: 'InboundEmailLambda',
          recipients: ['thalysrc.com'],
          actions: [
            new Lambda({
              function: reservationFromNotificationFunction,
              invocationType: LambdaInvocationType.EVENT
            })
          ],
          // Enable this to block spam emails if needed for your use case
          scanEnabled: true
        }
      ]
    });
  }
}
