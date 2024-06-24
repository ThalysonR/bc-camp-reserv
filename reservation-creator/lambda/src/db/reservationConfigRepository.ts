import { DynamoDB } from 'aws-sdk';
import { ReservationConfigRecord } from '../types';

// Initialize DynamoDB DocumentClient
const dynamoDb = new DynamoDB.DocumentClient();

// Define table name
const TABLE_NAME = 'ReservationConfigTable';

// Function to create or update a reservation configuration record
export async function putReservationConfigRecord(id: string, record: ReservationConfigRecord): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id,
      record
    }
  };

  try {
    await dynamoDb.put(params).promise();
    console.log('Reservation configuration record saved successfully.');
  } catch (error) {
    console.error('Error saving reservation configuration record:', error);
  }
}

// Function to get a reservation configuration record by id
export async function getReservationConfigRecordById(id: string): Promise<ReservationConfigRecord | null> {
  const params = {
    TableName: TABLE_NAME,
    Key: { id }
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item ? (result.Item.record as ReservationConfigRecord) : null;
  } catch (error) {
    console.error('Error fetching reservation configuration record:', error);
    return null;
  }
}

// Function to update a reservation configuration record
export async function updateReservationConfigRecord(id: string, updatedRecord: ReservationConfigRecord): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set #record = :record',
    ExpressionAttributeNames: {
      '#record': 'record'
    },
    ExpressionAttributeValues: {
      ':record': updatedRecord
    }
  };

  try {
    await dynamoDb.update(params).promise();
    console.log('Reservation configuration record updated successfully.');
  } catch (error) {
    console.error('Error updating reservation configuration record:', error);
  }
}

// Function to delete a reservation configuration record
async function deleteReservationConfigRecord(id: string): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Key: { id }
  };

  try {
    await dynamoDb.delete(params).promise();
    console.log('Reservation configuration record deleted successfully.');
  } catch (error) {
    console.error('Error deleting reservation configuration record:', error);
  }
}
