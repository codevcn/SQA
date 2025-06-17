import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Reservation = sequelize.define(
  "reservations",
  {
    ReservationID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Cus_Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: false,
    },
    Cus_FullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Cus_Phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ArrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    NumAdults: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    NumChildren: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Completed"),
      defaultValue: "Pending",
      allowNull: false,
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Reservations",
    timestamps: true,
    createdAt: "CreatedAt",
    updatedAt: "UpdatedAt",
  }
)

export default Reservation
