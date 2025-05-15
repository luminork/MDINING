export const chatService = {
  async sendMessage(userId: string, message: string) {
    try {
      const response = await fetch(
        "http://localhost:5000/send_message/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "message": message,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      // console.log("Response from server:", data);
      return data;
    } catch (error) {
      // console.error("Error in chatService:", error);
      throw error;
    }
  },
};
